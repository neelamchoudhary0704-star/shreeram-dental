# WhatsApp-based Appointment Booking (Premium Dental)

This workspace includes a self-contained, no-backend WhatsApp appointment booking UI suitable for a premium dental hospital.

Files added:
- `src/lib/clinic.ts` — clinic contact config and helper.
- `src/components/BookingForm.tsx` — reusable booking form component.
- `src/components/AppointmentSection.tsx` — premium appointment section (composes the form).
- `src/components/FloatingActions.tsx` — floating WhatsApp / Call / Emergency buttons.
- `src/components/ui/{Input,Select,Textarea}.tsx` — small reusable UI primitives.

Quick start

1. Install dependencies

```bash
cd "c:\complete web development file"
npm install
```

2. Configure environment

Create `.env.local` at the project root with:

```
NEXT_PUBLIC_WHATSAPP_NUMBER=15551234567
NEXT_PUBLIC_CLINIC_PHONE=+1-555-123-4567
NEXT_PUBLIC_EMERGENCY_PHONE=+1-555-999-0000
```

Notes: `NEXT_PUBLIC_WHATSAPP_NUMBER` must be E.164 without the plus sign for `wa.me` links (e.g. `15551234567`).

3. Use the component

Import and render `AppointmentSection` where you want the booking area. Example in an App Router page:

```tsx
import AppointmentSection from '@/components/AppointmentSection';

export default function Page() {
  const treatments = [
    { id: 'cleaning', name: 'Cleaning' },
    { id: 'veneers', name: 'Veneers' },
  ];
  const doctors = [{ id: 'dr-1', name: 'Dr. Elena Ruiz' }];

  return <AppointmentSection treatments={treatments} doctors={doctors} />;
}
```

4. Run dev server

```bash
npm run dev
```

Deployment

- Build and deploy like any Next.js app (Vercel, Netlify with Next support, or your hosting platform).
- Ensure the environment variables are set in production.

Accessibility & Validation

- Form fields include labels and basic client-side validation.
- Phone and email are validated with conservative regexes.

Customization

- Styles use Tailwind classes; edit `src/app/globals.css` and `tailwind.config.ts` for theme adjustments.
- Update `src/lib/clinic.ts` or env vars to change clinic contact numbers.
