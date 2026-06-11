import { NextRequest, NextResponse } from 'next/server';

const gasUrl = process.env.GAS_WEB_APP_URL;
if (!gasUrl) {
  throw new Error('Missing GAS_WEB_APP_URL environment variable. Set it in .env.local.');
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const url = new URL(gasUrl);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Unable to create appointment.' }, { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Appointment proxy error', error);
    return NextResponse.json({ error: 'Appointment proxy failed.' }, { status: 500 });
  }
}
