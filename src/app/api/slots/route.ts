import { NextRequest, NextResponse } from 'next/server';

const gasUrl = process.env.GAS_WEB_APP_URL;
if (!gasUrl) {
  throw new Error('Missing GAS_WEB_APP_URL environment variable. Set it in .env.local.');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const treatmentId = searchParams.get('treatmentId');

    if (!doctorId || !date || !treatmentId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const url = new URL(gasUrl);
    url.searchParams.set('action', 'slots');
    url.searchParams.set('doctorId', doctorId);
    url.searchParams.set('date', date);
    url.searchParams.set('treatmentId', treatmentId);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Unable to load slots.' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Slot proxy error', error);
    return NextResponse.json({ error: 'Slot proxy failed.' }, { status: 500 });
  }
}
