import React from 'react';
import { CLINIC, WHATSAPP_LINK } from '@/lib/clinic';

export default function FloatingActions() {
  const message = `Hello, I would like to book a dental appointment.`;
  const wa = WHATSAPP_LINK(message);

  return (
    <div aria-hidden className="fixed z-50 right-4 bottom-6 flex flex-col gap-3 items-end">
      <a
        href={`tel:${CLINIC.emergencyNumber}`}
        className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition"
        title="Emergency"
        aria-label="Emergency call"
      >
        EM
      </a>

      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition"
        title="WhatsApp"
        aria-label="Message via WhatsApp"
      >
        WA
      </a>

      <a href={`tel:${CLINIC.phoneNumber}`} className="w-12 h-12 rounded-full bg-amber-300 flex items-center justify-center text-white shadow-lg hover:scale-105 transition" title="Call" aria-label="Call clinic">
        ☏
      </a>
    </div>
  );
}
