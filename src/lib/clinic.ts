export const CLINIC = {
  name: 'Oral Aesthetics Concierge',
  // E.164 format without + sign for wa.me links (e.g. 15551234567)
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || 'YOUR_WHATSAPP_NUMBER',
  phoneNumber: process.env.NEXT_PUBLIC_CLINIC_PHONE || '+1-555-123-4567',
  emergencyNumber: process.env.NEXT_PUBLIC_EMERGENCY_PHONE || '+1-555-999-0000',
};

export const WHATSAPP_LINK = (text: string) => {
  const base = `https://wa.me/${CLINIC.whatsappNumber}`;
  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
};
