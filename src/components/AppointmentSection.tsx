import React from 'react';
import BookingForm from './BookingForm';
import FloatingActions from './FloatingActions';

type Props = {
  treatments: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
};

export default function AppointmentSection({ treatments, doctors }: Props) {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl bg-white/60 backdrop-blur-lg border border-white/30 p-8 md:p-12 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-3xl font-serif text-gray-900 mb-3">Book Your Appointment</h2>
              <p className="text-sm text-gray-600">Experience our premium dental services — fill in your preferred timings and we'll confirm via WhatsApp.</p>
              <div className="mt-6 text-xs text-gray-400">We respect your privacy. No data is stored on this site.</div>
            </div>

            <div>
              <BookingForm treatments={treatments} doctors={doctors} />
            </div>
          </div>
        </div>
      </div>
      <FloatingActions />
    </section>
  );
}
