import { createClient, SupabaseClient } from '@supabase/supabase-js';

import DashboardShell from './dashboard-shell';
import type { AppointmentRow, DashboardData, DoctorRow, ScheduleRow } from './types';

export const dynamic = 'force-dynamic';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are required for admin dashboard execution.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: globalThis.fetch.bind(globalThis) as typeof fetch },
  });
}

function assertIsUUID(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    throw new Error('Invalid UUID value detected.');
  }
}

function assertIsIsoDate(value: unknown): asserts value is string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('Invalid ISO date string detected.');
  }
}

function assertAppointmentStatus(value: unknown): asserts value is AppointmentStatus {
  if (typeof value !== 'string' || !APPOINTMENT_STATUSES.includes(value as AppointmentStatus)) {
    throw new Error('Invalid appointment status.');
  }
}

function assertNaturalNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || Math.floor(value) !== value) {
    throw new Error('Expected a natural integer number.');
  }
}

async function fetchAdminDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  const [{ data: appointments, error: appointmentError }, { data: doctors, error: doctorError }, { data: schedules, error: scheduleError }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select(
          `id,patient_name,patient_email,scheduled_at,status,doctor_id,treatment_id,fee,created_at,updated_at,doctor:doctors(id,name,specialty),treatment:treatments(id,name,duration_minutes)`
        )
        .order('scheduled_at', { ascending: true }),
      supabase.from('doctors').select('id,name,specialty').order('name', { ascending: true }),
      supabase.from('schedules').select('id,doctor_id,working_hours,breaks,buffer_minutes'),
    ]);

  if (appointmentError || doctorError || scheduleError) {
    console.error({ appointmentError, doctorError, scheduleError });
    throw new Error('Failed to load admin dashboard data from Supabase.');
  }

  return {
    appointments: (appointments ?? []).map((appointment) => ({
      id: appointment.id,
      patient_name: appointment.patient_name,
      patient_email: appointment.patient_email,
      scheduled_at: appointment.scheduled_at,
      status: appointment.status as AppointmentStatus,
      doctor_id: appointment.doctor_id,
      treatment_id: appointment.treatment_id,
      fee: Number(appointment.fee ?? 0),
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      doctor: appointment.doctor,
      treatment: appointment.treatment,
    })),
    doctors: (doctors ?? []).map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
    })),
    schedules: (schedules ?? []).map((schedule) => ({
      id: schedule.id,
      doctor_id: schedule.doctor_id,
      working_hours: schedule.working_hours ?? [],
      breaks: schedule.breaks ?? [],
      buffer_minutes: Number(schedule.buffer_minutes ?? 0),
    })),
  };
}

function calculateRevenueProjection(appointments: AppointmentRow[]): number {
  return appointments.reduce((total, appointment) => total + Math.max(0, appointment.fee), 0);
}

async function handleAppointmentAction(formData: FormData, nextStatus: AppointmentStatus | 'delete') {
  const appointmentId = formData.get('appointment_id');
  assertIsUUID(appointmentId);

  const supabase = getSupabaseClient();

  if (nextStatus === 'delete') {
    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
    if (error) {
      throw new Error('Unable to delete appointment record.');
    }
    return;
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', appointmentId);

  if (error) {
    throw new Error('Unable to update appointment status.');
  }
}

async function approveAppointment(formData: FormData) {
  'use server';
  await handleAppointmentAction(formData, 'confirmed');
}

async function cancelAppointment(formData: FormData) {
  'use server';
  await handleAppointmentAction(formData, 'cancelled');
}

async function deleteAppointment(formData: FormData) {
  'use server';
  await handleAppointmentAction(formData, 'delete');
}

async function updateDoctorScheduleConfig(formData: FormData) {
  'use server';
  const doctorId = formData.get('doctor_id');
  const workingHours = formData.get('working_hours');
  const breaks = formData.get('breaks');
  const bufferMinutes = formData.get('buffer_minutes');

  assertIsUUID(doctorId);

  if (typeof workingHours !== 'string' || typeof breaks !== 'string') {
    throw new Error('Schedule payload must be JSON encoded strings.');
  }

  let parsedWorkingHours: Array<{ day: string; start: string; end: string }>;
  let parsedBreaks: Array<{ start: string; end: string; reason?: string }>;
  let parsedBufferMinutes: number;

  try {
    parsedWorkingHours = JSON.parse(workingHours);
    parsedBreaks = JSON.parse(breaks);
    parsedBufferMinutes = Number(bufferMinutes);
  } catch {
    throw new Error('Malformed schedule payload.');
  }

  if (!Array.isArray(parsedWorkingHours) || !Array.isArray(parsedBreaks) || Number.isNaN(parsedBufferMinutes)) {
    throw new Error('Invalid schedule data.');
  }

  parsedWorkingHours.forEach((entry) => {
    assertIsIsoDate(`${entry.day}T00:00:00.000Z`);
    if (typeof entry.start !== 'string' || typeof entry.end !== 'string') {
      throw new Error('Working hours entries require start and end strings.');
    }
  });

  parsedBreaks.forEach((entry) => {
    if (typeof entry.start !== 'string' || typeof entry.end !== 'string') {
      throw new Error('Break entries require start and end string values.');
    }
  });

  assertNaturalNumber(parsedBufferMinutes);

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('schedules').upsert(
    {
      doctor_id: doctorId,
      working_hours: parsedWorkingHours,
      breaks: parsedBreaks,
      buffer_minutes: parsedBufferMinutes,
    },
    { onConflict: 'doctor_id' }
  );

  if (error) {
    throw new Error('Unable to save schedule configuration.');
  }
}

export default async function Page() {
  const { appointments, doctors, schedules } = await fetchAdminDashboardData();
  const totalBookings = appointments.length;
  const pendingRequests = appointments.filter((appointment) => appointment.status === 'pending').length;
  const revenueProjection = calculateRevenueProjection(appointments);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="space-y-6">
          <div className="rounded-3xl border border-amber-500/10 bg-slate-900/80 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Executive Operations</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Premium Dental Hospital Admin Control Panel</h1>
                <p className="mt-3 max-w-2xl text-slate-400">Manage bookings, approvals, cancellations, and working-hour configurations for luxury dental care delivery.</p>
              </div>
              <div className="rounded-3xl border border-amber-400/10 bg-slate-950/80 p-4 text-right text-sm text-slate-300 shadow-inner shadow-slate-900/40">
                <span className="block text-amber-200">Secure server-side Supabase sync</span>
                <span className="block text-slate-500">Reactive filtering, action flows, and schedule persistence.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/30">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Total Bookings</p>
              <p className="mt-6 text-5xl font-semibold text-white">{totalBookings}</p>
              <p className="mt-3 text-slate-400">All managed requests across doctors, treatments, and confirmed appointments.</p>
            </div>
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/30">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Pending Requests</p>
              <p className="mt-6 text-5xl font-semibold text-white">{pendingRequests}</p>
              <p className="mt-3 text-slate-400">Bookings that require approval or administrator intervention.</p>
            </div>
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/75 p-6 shadow-xl shadow-slate-950/30">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Revenue Projection</p>
              <p className="mt-6 text-5xl font-semibold text-white">₹{revenueProjection.toLocaleString('en-IN')}</p>
              <p className="mt-3 text-slate-400">Projected revenue based on all logged appointment fees.</p>
            </div>
          </div>

          <DashboardShell
            appointments={appointments}
            doctors={doctors}
            schedules={schedules}
            approveAppointment={approveAppointment}
            cancelAppointment={cancelAppointment}
            deleteAppointment={deleteAppointment}
            updateDoctorScheduleConfig={updateDoctorScheduleConfig}
          />
        </section>
      </main>
    </div>
  );
}
