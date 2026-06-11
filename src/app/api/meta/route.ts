import { NextResponse } from 'next/server';

const gasUrl = process.env.GAS_WEB_APP_URL;
if (!gasUrl) {
  throw new Error('Missing GAS_WEB_APP_URL environment variable. Set it in .env.local.');
}

export async function GET() {
  try {
    const url = new URL(gasUrl);
    url.searchParams.set('action', 'meta');

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Unable to load metadata.' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Meta proxy error', error);
    return NextResponse.json({ error: 'Meta proxy failed.' }, { status: 500 });
  }
}
