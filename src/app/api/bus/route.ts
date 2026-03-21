import { NextRequest, NextResponse } from 'next/server';
import { getSeoulBusArrival } from '@/lib/api/bus';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const arsId = searchParams.get('arsId');

  if (!arsId) {
    return NextResponse.json(
      { error: 'arsId 파라미터가 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    const arrivals = await getSeoulBusArrival(arsId);
    return NextResponse.json({ arrivals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /bus]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
