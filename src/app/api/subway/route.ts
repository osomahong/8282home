import { NextRequest, NextResponse } from 'next/server';
import { getSubwayArrival } from '@/lib/api/subway';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const station = searchParams.get('station');

  if (!station) {
    return NextResponse.json(
      { error: 'station 파라미터가 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    const arrivals = await getSubwayArrival(station);
    return NextResponse.json({ arrivals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /subway]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
