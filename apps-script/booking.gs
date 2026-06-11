const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const ADMIN_EMAIL = 'admin@example.com';

function doGet(e) {
  const action = e.parameter.action;

  switch (action) {
    case 'meta':
      return ContentService.createTextOutput(JSON.stringify(getMeta())).setMimeType(ContentService.MimeType.JSON);
    case 'slots':
      return ContentService.createTextOutput(JSON.stringify(getSlots(e.parameter))).setMimeType(ContentService.MimeType.JSON);
    default:
      return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const validation = validateBookingPayload(data);
    if (!validation.valid) {
      return respondError(validation.message, 400);
    }

    const appointment = createAppointment(data);
    const eventResponse = createCalendarEvent(appointment);
    appointment.calendar_event_id = eventResponse.id;
    writeAppointment(appointment);
    sendConfirmationEmails(appointment);

    return ContentService.createTextOutput(JSON.stringify({ success: true, appointment })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return respondError('Booking failed: ' + error.message, 500);
  }
}

function getMeta() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const doctors = readSheet(sheet, 'Doctors');
  const treatments = readSheet(sheet, 'Treatments');

  return {
    doctors: doctors.filter((row) => row.is_active === 'true'),
    treatments: treatments.filter((row) => row.is_active === 'true'),
  };
}

function getSlots(params) {
  const doctorId = params.doctorId;
  const date = params.date;
  const treatmentId = params.treatmentId;

  if (!doctorId || !date || !treatmentId) {
    return { error: 'Missing parameters' };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const schedules = readSheet(sheet, 'Schedules');
  const treatments = readSheet(sheet, 'Treatments');
  const appointments = readSheet(sheet, 'Appointments');

  const selectedTreatment = treatments.find((row) => row.id === treatmentId);
  if (!selectedTreatment) {
    return { error: 'Treatment not found' };
  }

  const duration = Number(selectedTreatment.duration_minutes);
  const dayOfWeek = new Date(date).getDay();
  const schedule = schedules.find((row) => row.doctorId === doctorId && Number(row.day_of_week) === dayOfWeek);

  if (!schedule) {
    return { slots: [] };
  }

  const booked = appointments
    .filter((row) => row.doctor_id === doctorId && row.appointment_date === date && ['pending', 'confirmed', 'rescheduled'].includes(row.status))
    .map((row) => ({
      start: parseTime(row.start_time),
      end: parseTime(row.end_time),
    }));

  const start = parseTime(schedule.start_time);
  const end = parseTime(schedule.end_time);
  const breakStart = schedule.break_start ? parseTime(schedule.break_start) : null;
  const breakEnd = schedule.break_end ? parseTime(schedule.break_end) : null;
  const interval = Number(schedule.slot_interval_minutes);
  const buffer = Number(schedule.buffer_minutes);

  const slots = [];
  let current = new Date(start.getTime());

  while (current.getTime() + duration * 60000 <= end.getTime()) {
    const slotEnd = new Date(current.getTime() + duration * 60000);
    if (!isInBreak(current, slotEnd, breakStart, breakEnd) && !isBooked(current, slotEnd, booked)) {
      slots.push(formatTime(current));
    }
    current = new Date(current.getTime() + (interval + buffer) * 60000);
  }

  return { slots };
}

function validateBookingPayload(payload) {
  const requiredFields = ['doctorId', 'treatmentId', 'date', 'timeSlot', 'name', 'email', 'phone', 'age'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      return { valid: false, message: `${field} is required.` };
    }
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    return { valid: false, message: 'Invalid email address.' };
  }

  if (Number(payload.age) < 0) {
    return { valid: false, message: 'Age must be a valid number.' };
  }

  return { valid: true };
}

function createAppointment(data) {
  const treatments = readSheet(SpreadsheetApp.openById(SPREADSHEET_ID), 'Treatments');
  const treatment = treatments.find((row) => row.id === data.treatmentId);
  const startTime = parseTime(data.timeSlot);
  const endTime = new Date(startTime.getTime() + Number(treatment.duration_minutes) * 60000);

  return {
    created_at: new Date().toISOString(),
    doctor_id: data.doctorId,
    treatment_id: data.treatmentId,
    appointment_date: data.date,
    start_time: formatTime(startTime),
    end_time: formatTime(endTime),
    patient_name: data.name,
    patient_email: data.email,
    patient_phone: data.phone,
    patient_age: Number(data.age),
    notes: data.notes || '',
    status: 'confirmed',
    calendar_event_id: '',
  };
}

function createCalendarEvent(appointment) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const doctors = readSheet(sheet, 'Doctors');
  const treatments = readSheet(sheet, 'Treatments');

  const doctor = doctors.find((row) => row.id === appointment.doctor_id);
  const treatment = treatments.find((row) => row.id === appointment.treatment_id);
  const calendarId = doctor.calendarId || 'primary';
  const eventTitle = `${treatment.name} with ${doctor.name}`;
  const eventDescription =
    `Patient: ${appointment.patient_name}\nEmail: ${appointment.patient_email}\nPhone: ${appointment.patient_phone}\nAge: ${appointment.patient_age}\nNotes: ${appointment.notes}`;

  const startDate = new Date(`${appointment.appointment_date}T${appointment.start_time}:00`);
  const endDate = new Date(`${appointment.appointment_date}T${appointment.end_time}:00`);

  return CalendarApp.getCalendarById(calendarId).createEvent(eventTitle, startDate, endDate, {
    description: eventDescription,
    guests: appointment.patient_email,
    sendInvites: true,
  });
}

function writeAppointment(appointment) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Appointments');
  if (!sheet) {
    throw new Error('Appointments sheet not found.');
  }

  sheet.appendRow([
    appointment.created_at,
    appointment.doctor_id,
    appointment.treatment_id,
    appointment.appointment_date,
    appointment.start_time,
    appointment.end_time,
    appointment.patient_name,
    appointment.patient_email,
    appointment.patient_phone,
    appointment.patient_age,
    appointment.notes,
    appointment.status,
    appointment.calendar_event_id,
  ]);
}

function sendConfirmationEmails(appointment) {
  const doctor = getDoctorById(appointment.doctor_id);
  const treatment = getTreatmentById(appointment.treatment_id);
  const patientSubject = `Appointment Confirmed: ${treatment.name}`;
  const adminSubject = `New Appointment: ${appointment.patient_name}`;

  const patientBody =
    `Dear ${appointment.patient_name},\n\n` +
    `Your appointment for ${treatment.name} with ${doctor.name} is confirmed on ${appointment.appointment_date} at ${appointment.start_time}.\n\n` +
    `If you need to reschedule, please reply to this email.\n\n` +
    `Warm regards,\nOral Aesthetics Concierge`;

  const adminBody =
    `New appointment has been created.\n\n` +
    `Patient: ${appointment.patient_name}\n` +
    `Email: ${appointment.patient_email}\n` +
    `Phone: ${appointment.patient_phone}\n` +
    `Procedure: ${treatment.name}\n` +
    `Doctor: ${doctor.name}\n` +
    `Date: ${appointment.appointment_date} ${appointment.start_time} - ${appointment.end_time}\n\n` +
    `Notes: ${appointment.notes}`;

  MailApp.sendEmail(appointment.patient_email, patientSubject, patientBody);
  MailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminBody);
}

function readSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Missing sheet: ${sheetName}`);
  }

  const [headerRow, ...rows] = sheet.getDataRange().getValues();
  return rows.map((row) => {
    const rowObject = {};
    headerRow.forEach((header, index) => {
      rowObject[header.toString().trim()] = row[index] !== undefined ? row[index].toString() : '';
    });
    return rowObject;
  });
}

function parseTime(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatTime(date) {
  const pad = (value) => (value < 10 ? `0${value}` : `${value}`);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isInBreak(start, end, breakStart, breakEnd) {
  if (!breakStart || !breakEnd) {
    return false;
  }
  return start < breakEnd && end > breakStart;
}

function isBooked(start, end, bookedIntervals) {
  return bookedIntervals.some((booking) => start < booking.end && end > booking.start);
}

function getDoctorById(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return readSheet(sheet, 'Doctors').find((row) => row.id === id) || { name: 'Clinician' };
}

function getTreatmentById(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return readSheet(sheet, 'Treatments').find((row) => row.id === id) || { name: 'Service' };
}
