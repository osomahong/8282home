import { NextRequest, NextResponse } from 'next/server';
import { searchRoutes, normalizeOdsayPaths } from '@/lib/api/odsay';
import { ORIGIN, DEST, MAX_ROUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const originLng = parseFloat(searchParams.get('originLng') ?? String(ORIGIN.lng));
    const originLat = parseFloat(searchParams.get('originLat') ?? String(ORIGIN.lat));
    const destLng = parseFloat(searchParams.get('destLng') ?? String(DEST.lng));
    const destLat = parseFloat(searchParams.get('destLat') ?? String(DEST.lat));

    const data = await searchRoutes(originLng, originLat, destLng, destLat);

    const paths = data.result?.path;
    if (!paths || paths.length === 0) {
      return NextResponse.json(
        { error: '경로를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const routes = normalizeOdsayPaths(paths.slice(0, MAX_ROUTES));

    return NextResponse.json({ routes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API /routes]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
