'use client';

import { useMemo, useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AppointmentRow, AppointmentStatus, DoctorRow, ScheduleRow } from './types';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

type DashboardShellProps = {
  appointments: AppointmentRow[];
  doctors: DoctorRow[];
  schedules: ScheduleRow[];
  approveAppointment: (formData: FormData) => Promise<void>;
  cancelAppointment: (formData: FormData) => Promise<void>;
  deleteAppointment: (formData: FormData) => Promise<void>;
  updateDoctorScheduleConfig: (formData: FormData) => Promise<void>;
};

export default function DashboardShell({
  appointments,
  doctors,
  schedules,
  approveAppointment,
  cancelAppointment,
  deleteAppointment,
  updateDoctorScheduleConfig,
}: DashboardShellProps) {
  const router = useRouter();
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AppointmentStatus>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (selectedDoctor !== 'all' && appointment.doctor_id !== selectedDoctor) return false;
      if (selectedStatus !== 'all' && appointment.status !== selectedStatus) return false;
      if (selectedDate && appointment.scheduled_at.slice(0, 10) !== selectedDate) return false;
      return true;
    });
  }, [appointments, selectedDoctor, selectedStatus, selectedDate]);

  const handleFormSubmit = (action: (formData: FormData) => Promise<void>) => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      await action(formData);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Booking Controls</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Global Appointment Filtering</h2>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3 xl:w-auto">
            <label className="flex flex-col gap-2 text-slate-300">
              Doctor
              <select
                value={selectedDoctor}
                onChange={(event) => setSelectedDoctor(event.target.value)}
                className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              >
                <option value="all">All doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-slate-300">
              Date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              />
            </label>
            <label className="flex flex-col gap-2 text-slate-300">
              Status
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as 'all' | AppointmentStatus)}
                className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              >
                <option value="all">All statuses</option>
                {APPOINTMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Treatment</th>
                <th className="px-6 py-4 font-medium">Scheduled</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Fee</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-slate-800/80 hover:bg-slate-900/80">
                  <td className="px-6 py-4 text-slate-200">
                    <div className="font-semibold">{appointment.patient_name}</div>
                    <div className="text-slate-500">{appointment.patient_email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-200">{appointment.doctor?.name ?? 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-200">{appointment.treatment?.name ?? 'General'}</td>
                  <td className="px-6 py-4 text-slate-200">{new Date(appointment.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      appointment.status === 'confirmed' ? 'bg-amber-500/15 text-amber-300' : appointment.status === 'pending' ? 'bg-slate-700/70 text-slate-100' : 'bg-red-500/10 text-red-200'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-200">₹{appointment.fee.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 space-y-2">
                    <form className="grid gap-2" onSubmit={handleFormSubmit(approveAppointment)}>
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isPending}
                      >
                        Approve
                      </button>
                    </form>
                    <form className="grid gap-2" onSubmit={handleFormSubmit(cancelAppointment)}>
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isPending}
                      >
                        Cancel
                      </button>
                    </form>
                    <form className="grid gap-2" onSubmit={handleFormSubmit(deleteAppointment)}>
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No appointments match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Configuration Center</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Doctor Scheduling &amp; Buffer Management</h2>
          </div>
          <p className="max-w-2xl text-slate-400">Update working-hour arrays, break patterns, and buffer minutes per doctor with immediate persistence.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {doctors.map((doctor) => {
            const schedule = schedules.find((entry) => entry.doctor_id === doctor.id) ?? {
              id: `${doctor.id}-default`,
              doctor_id: doctor.id,
              working_hours: [],
              breaks: [],
              buffer_minutes: 15,
            };

            return (
              <form key={doctor.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6" onSubmit={handleFormSubmit(updateDoctorScheduleConfig)}>
                <input type="hidden" name="doctor_id" value={doctor.id} />
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Doctor</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{doctor.name}</h3>
                    <p className="text-slate-400">{doctor.specialty ?? 'General Dentistry'}</p>
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-200">Buffer {schedule.buffer_minutes}m</span>
                </div>

                <div className="mt-6 space-y-5">
                  <label className="grid gap-2 text-slate-300">
                    Working hours JSON
                    <textarea
                      name="working_hours"
                      defaultValue={JSON.stringify(schedule.working_hours, null, 2)}
                      rows={6}
                      className="w-full resize-none rounded-3xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300"
                    />
                  </label>
                  <label className="grid gap-2 text-slate-300">
                    Breaks JSON
                    <textarea
                      name="breaks"
                      defaultValue={JSON.stringify(schedule.breaks, null, 2)}
                      rows={5}
                      className="w-full resize-none rounded-3xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300"
                    />
                  </label>
                  <label className="grid gap-2 text-slate-300">
                    Buffer minutes
                    <input
                      name="buffer_minutes"
                      type="number"
                      defaultValue={schedule.buffer_minutes}
                      min={0}
                      className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
                    />
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
