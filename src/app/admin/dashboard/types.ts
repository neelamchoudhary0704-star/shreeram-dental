export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type DoctorRow = {
  id: string;
  name: string;
  specialty: string | null;
};

export type TreatmentRow = {
  id: string;
  name: string;
  duration_minutes: number | null;
};

export type ScheduleRow = {
  id: string;
  doctor_id: string;
  working_hours: Array<{ day: string; start: string; end: string }>;
  breaks: Array<{ start: string; end: string; reason?: string }>;
  buffer_minutes: number;
};

export type AppointmentRow = {
  id: string;
  patient_name: string;
  patient_email: string;
  scheduled_at: string;
  status: AppointmentStatus;
  doctor_id: string;
  treatment_id: string;
  fee: number;
  created_at: string;
  updated_at: string;
  doctor: DoctorRow | null;
  treatment: TreatmentRow | null;
};

export type DashboardData = {
  appointments: AppointmentRow[];
  doctors: DoctorRow[];
  schedules: ScheduleRow[];
};
