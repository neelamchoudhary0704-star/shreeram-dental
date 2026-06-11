# Google Sheets + Google Calendar Appointment Booking

This project is now configured to use a Google Apps Script web app as the backend for booking appointments.

## What this system includes

- booking page UI in `src/app/page.tsx`
- premium Tailwind styling
- Google Sheets data model for doctors, treatments, schedules, and appointments
- Google Calendar event creation by Apps Script
- confirmation emails for patients and admin
- availability slot generation from doctor schedules

## Google Sheets tabs and columns

1. `Doctors`
   - `id` (text, unique)
   - `name`
   - `specialty`
   - `calendarId` (Google Calendar ID or `primary`)
   - `is_active` (`true` / `false`)

2. `Treatments`
   - `id` (text, unique)
   - `name`
   - `duration_minutes`
   - `price`
   - `is_active` (`true` / `false`)

3. `Schedules`
   - `doctorId`
   - `day_of_week` (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   - `start_time` (`HH:mm`)
   - `end_time` (`HH:mm`)
   - `break_start` (`HH:mm` or blank)
   - `break_end` (`HH:mm` or blank)
   - `slot_interval_minutes`
   - `buffer_minutes`

4. `Appointments`
   - `created_at`
   - `doctor_id`
   - `treatment_id`
   - `appointment_date`
   - `start_time`
   - `end_time`
   - `patient_name`
   - `patient_email`
   - `patient_phone`
   - `patient_age`
   - `notes`
   - `status`
   - `calendar_event_id`

## Apps Script backend

Create a new Apps Script project attached to the sheet and paste the script from `apps-script/booking.gs`.

### Deploy the web app

1. Open the Apps Script editor.
2. Select `Deploy` → `New deployment`.
3. Choose `Web app`.
4. Set `Execute as` to `Me`.
5. Set `Who has access` to `Anyone` or `Anyone with Google account`, depending on your needs.
6. Deploy and copy the web app URL.

### Connect to the Next.js UI

1. Add `.env.local` to the project root.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_GAS_WEB_APP_URL` to your deployed Apps Script URL.
4. Restart `npm run dev`.

## Local UI behavior

- `src/app/page.tsx` fetches doctor and treatment metadata from the Apps Script endpoint.
- available slots are loaded from the same Apps Script service.
- booking reservations are sent to the Apps Script backend, which writes to Google Sheets and creates a Calendar event.

## Notes

- If you want email notifications to go to a custom address, update `ADMIN_EMAIL` in `apps-script/booking.gs`.
- For professional security, keep `.env.local` out of version control.
