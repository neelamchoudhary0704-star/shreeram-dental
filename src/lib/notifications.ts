export type ResendEmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type AppointmentConfirmationData = {
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  treatmentName: string;
  clinicAddress: string;
};

export type WhatsAppMessagePayload = {
  toPhoneNumber: string;
  message: string;
  appointmentId: string;
};

export type WhatsAppWebhookEvent = {
  eventType: 'message.delivered' | 'message.failed' | 'message.received';
  phoneNumber: string;
  messageId: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required for email delivery.');
  }
  return apiKey;
}

function getWhatsAppApiConfig() {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  if (!apiUrl || !apiToken) {
    throw new Error('WhatsApp API configuration is not available.');
  }
  return { apiUrl, apiToken };
}

function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function sendAppointmentConfirmationEmail(data: AppointmentConfirmationData): Promise<void> {
  const apiKey = getResendApiKey();
  const templateHtml = `
    <div style="font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0;">
        <h1 style="font-size: 28px; color: #92400e; margin-bottom: 16px;">Appointment Confirmed</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">Dear ${data.patientName},</p>
        <p style="font-size: 16px; color: #475569;">Your appointment with Dr. ${data.doctorName} has been confirmed for <strong>${data.appointmentDate} at ${data.appointmentTime}</strong>.</p>
        <p style="font-size: 16px; color: #475569; margin: 24px 0;">Treatment: <strong>${data.treatmentName}</strong></p>
        <p style="font-size: 16px; color: #475569;">Clinic address: ${data.clinicAddress}</p>
        <p style="font-size: 16px; color: #475569; margin-top: 24px;">We look forward to welcoming you for a premium dental care experience.</p>
      </div>
    </div>
  `;

  if (!validateEmail(data.patientEmail)) {
    throw new Error('Patient email is invalid.');
  }

  const payload: ResendEmailPayload = {
    from: 'no-reply@shreeramdental.com',
    to: `${data.patientName} <${data.patientEmail}>`,
    subject: `Appointment confirmed with Dr. ${data.doctorName}`,
    html: templateHtml,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API email dispatch failed: ${response.status} ${errorBody}`);
  }
}

export async function sendWhatsAppNotification(payload: WhatsAppMessagePayload): Promise<void> {
  const { apiUrl, apiToken } = getWhatsAppApiConfig();

  if (!/^[0-9]+$/.test(payload.toPhoneNumber)) {
    throw new Error('WhatsApp destination phone number must be a numeric E.164 string without formatting.');
  }

  const body = {
    to: payload.toPhoneNumber,
    type: 'text',
    text: {
      body: payload.message,
    },
    metadata: {
      appointmentId: payload.appointmentId,
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp Business API request failed: ${response.status} ${errorBody}`);
  }
}

export function handleWhatsAppWebhook(event: WhatsAppWebhookEvent): { accepted: boolean; message: string } {
  if (!event.eventType || !event.phoneNumber || !event.messageId || !event.timestamp) {
    throw new Error('Invalid WhatsApp webhook payload.');
  }

  return {
    accepted: true,
    message: `Webhook event ${event.eventType} received for ${event.phoneNumber}.`,
  };
}

export function setup24HourReminderCron(): void {
  const cronSchedule = process.env.REMINDER_CRON_SCHEDULE ?? '0 8 * * *';
  const cronModule = require('node-cron');

  if (!cronModule || typeof cronModule.schedule !== 'function') {
    throw new Error('node-cron must be available for reminder scheduling.');
  }

  cronModule.schedule(cronSchedule, async () => {
    await dispatch24HourAppointmentReminders();
  });
}

export async function dispatch24HourAppointmentReminders(): Promise<void> {
  // Query your Supabase appointment table for appointments scheduled 24 hours out and send reminders.
  // This function is intentionally structured for extension by your admin worker process.
  console.debug('Dispatching 24-hour appointment reminders.');
}
