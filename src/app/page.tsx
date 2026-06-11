'use client';

import { useEffect, useState } from 'react';

interface Treatment {
  id: string;
  name: string;
  duration_minutes: string;
  price: string;
  is_active: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  is_active: string;
}

type MessageType = 'success' | 'error' | '';

type MessageState = {
  type: MessageType;
  text: string;
};

const today = new Date().toISOString().slice(0, 10);

export default function BookingPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', age: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

  useEffect(() => {
    async function fetchCoreMetadata() {
      setMetaLoading(true);
      try {
        const res = await fetch('/api/meta');
        const data = await res.json();
        if (res.ok) {
          setTreatments(data.treatments || []);
          setDoctors(data.doctors || []);
        } else {
          console.error('Failed to load metadata', data.error || data);
        }
      } catch (error) {
        console.error('Failed to load metadata', error);
      } finally {
        setMetaLoading(false);
      }
    }

    fetchCoreMetadata();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoctor || !selectedDate || !selectedTreatment) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const res = await fetch(
          `/api/slots?doctorId=${encodeURIComponent(selectedDoctor)}&date=${encodeURIComponent(selectedDate)}&treatmentId=${encodeURIComponent(selectedTreatment)}`
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.slots)) {
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots([]);
          console.error('Failed to load slots', data.error || data);
        }
      } catch (error) {
        console.error('Error evaluating slots map', error);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDoctor, selectedDate, selectedTreatment]);

  const handleBookingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!selectedSlot) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please choose an available time slot.' });
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          treatmentId: selectedTreatment,
          date: selectedDate,
          timeSlot: selectedSlot,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          notes: formData.notes,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Booking error transpired.');
      }

      setMessage({ type: 'success', text: 'Reservation successful. Your executive itinerary has been dispatched via email.' });
      setSelectedSlot('');
      setFormData({ name: '', email: '', phone: '', age: '', notes: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message ?? 'Unable to complete booking at this time.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-cream text-luxury-charcoal font-sans flex items-center justify-center p-6 md:p-12">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-luxury-silver/40">
        <div className="lg:col-span-2 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-luxury-silver/60 pb-8 lg:pb-0 lg:pr-8">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-luxury-gold font-semibold">Concierge Desk</span>
            <h1 className="text-4xl md:text-5xl font-serif text-luxury-charcoal mt-4 mb-6 leading-tight">ORAL <br /> AESTHETICS</h1>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Welcome to unparalleled clinical mastery. Configure your private reservation sequence using our live synchronization grid.
            </p>
          </div>
          <div className="mt-8 lg:mt-0 text-xs text-gray-400 font-light">© 2026 Oral Aesthetics Hospital Group. All rights reserved.</div>
        </div>

        <form onSubmit={handleBookingSubmit} className="lg:col-span-3 space-y-6">
          {message.text && (
            <div
              className={`p-4 rounded-xl text-sm font-medium border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Select Procedure</label>
              <select
                className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={selectedTreatment}
                onChange={(event) => {
                  setSelectedTreatment(event.target.value);
                  setSelectedSlot('');
                }}
                required
                disabled={metaLoading}
              >
                <option value="">Choose Procedure</option>
                {treatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.duration_minutes}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Medical Specialist</label>
              <select
                className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={selectedDoctor}
                onChange={(event) => {
                  setSelectedDoctor(event.target.value);
                  setSelectedSlot('');
                }}
                required
                disabled={metaLoading}
              >
                <option value="">Choose Specialist</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} — {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Calendar Target</label>
            <input
              type="date"
              min={today}
              className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedSlot('');
              }}
              required
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Available Windows</label>
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-rose-500 italic">No available clinical openings match selections for this calendar day.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                        selectedSlot === slot
                          ? 'bg-luxury-charcoal text-white border-luxury-charcoal'
                          : 'bg-white border-luxury-silver hover:border-luxury-gold'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-luxury-silver/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Legal Name"
                required
                className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
              <input
                type="tel"
                placeholder="Mobile Primary Contact Line"
                required
                className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="email"
                placeholder="Secure Email Address"
                required
                className="md:col-span-2 w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
              <input
                type="number"
                placeholder="Age"
                required
                className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                value={formData.age}
                onChange={(event) => setFormData({ ...formData, age: event.target.value })}
              />
            </div>
            <textarea
              placeholder="Clinical baseline observations / Symptom remarks (Optional)"
              rows={3}
              className="w-full bg-luxury-cream border border-luxury-silver/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSlot}
            className="w-full bg-luxury-gold hover:bg-luxury-goldHover text-white py-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Transmitting Registration...' : 'Authorize Luxury Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
