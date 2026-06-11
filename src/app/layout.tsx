import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oral Aesthetics Concierge',
  description: 'Premium dental appointment booking with Google Calendar and Google Sheets automation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
