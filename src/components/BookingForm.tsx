import React, { useState } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { CLINIC, WHATSAPP_LINK } from '@/lib/clinic';

type Props = {
  treatments: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
};

const phoneRegex = /^\+?[0-9\-\s()]{7,20}$/;
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function BookingForm({ treatments, doctors }: Props) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    treatment: '',
    doctor: '',
    date: '',
    time: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function validate() {
    if (!form.name.trim()) return 'Name is required.';
    if (!phoneRegex.test(form.phone.trim())) return 'Enter a valid phone number.';
    if (!emailRegex.test(form.email.trim())) return 'Enter a valid email address.';
    if (!form.treatment) return 'Please select a treatment.';
    if (!form.doctor) return 'Please select a preferred doctor.';
    if (!form.date) return 'Please select a preferred date.';
    if (!form.time) return 'Please select a preferred time.';
    return '';
  }

  function buildMessage() {
    return `Hello, I would like to book a dental appointment.\n\nPatient Details:\n- Name: ${form.name}\n- Mobile: ${form.phone}\n- Email: ${form.email}\n\nAppointment Details:\n- Treatment: ${treatments.find((t) => t.id === form.treatment)?.name || form.treatment}\n- Doctor: ${doctors.find((d) => d.id === form.doctor)?.name || form.doctor}\n- Preferred Date: ${form.date}\n- Preferred Time: ${form.time}\n\nNotes:\n${form.notes}\n\nPlease confirm my appointment availability.`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    const message = buildMessage();
    setSuccess('Opening WhatsApp with your message...');

    // small timeout to show success state and then redirect to WhatsApp
    setTimeout(() => {
      const link = WHATSAPP_LINK(message);
      window.open(link, '_blank', 'noopener');
      setLoading(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Appointment booking form">
      {error && <div className="text-sm text-rose-600 font-medium">{error}</div>}
      {success && <div className="text-sm text-emerald-700 font-medium">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input
          label="Mobile Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="e.g. +1-555-123-4567"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Select
          label="Treatment Type"
          options={treatments.map((t) => ({ value: t.id, label: t.name }))}
          value={form.treatment}
          onChange={(e) => setForm({ ...form, treatment: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Preferred Doctor"
          options={doctors.map((d) => ({ value: d.id, label: d.name }))}
          value={form.doctor}
          onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          required
        />
        <Input label="Preferred Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <Input label="Preferred Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
      </div>

      <Textarea label="Additional Notes / Symptoms" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-amber-300 hover:bg-amber-350 text-charcoal px-5 py-3 text-sm font-semibold shadow soft transition"
          disabled={loading}
        >
          {loading ? 'Preparing WhatsApp...' : `Book Appointment via WhatsApp`}
        </button>

        <a href={`tel:${CLINIC.phoneNumber}`} className="text-sm text-gray-600 underline">
          Call clinic
        </a>
      </div>
    </form>
  );
}
