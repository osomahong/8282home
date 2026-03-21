import { NextRequest, NextResponse } from 'next/server';

const ODSAY_BASE_URL = 'https://api.odsay.com/v1/api';

interface OdsayStation {
  stationName: string;
  stationID: number;
  x: number; // lng
  y: number; // lat
  stationType: number; // 1: 버스, 2: 지하철
  laneName?: string;
  lineId?: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('q');

  if (!keyword?.trim()) {
    return NextResponse.json({ error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // "역", "정류장", "station" 등 접미사 제거 — ODsay는 순수 역명으로 검색
    const cleaned = keyword.trim().replace(/(역|정류장|station)$/i, '').trim();
    if (!cleaned) {
      return NextResponse.json({ error: '검색어를 입력해 주세요.' }, { status: 400 });
    }

    // Referer: ODsay는 등록된 URI와 대조
    const referer =
      process.env.SITE_URL ?? 'http://localhost:3000';

    // 지하철 + 버스 병렬 검색
    const [subwayRes, busRes] = await Promise.all([
      fetch(`${ODSAY_BASE_URL}/searchStation?${new URLSearchParams({
        lang: '0', stationName: cleaned, stationClass: '2', apiKey,
      })}`, { headers: { Referer: referer } }),
      fetch(`${ODSAY_BASE_URL}/searchStation?${new URLSearchParams({
        lang: '0', stationName: cleaned, stationClass: '1', apiKey,
      })}`, { headers: { Referer: referer } }),
    ]);

    if (!subwayRes.ok && !busRes.ok) {
      return NextResponse.json({ error: '역/정류장 검색에 실패했습니다.' }, { status: 502 });
    }

    const subwayData = subwayRes.ok ? await subwayRes.json() : { result: { station: [] } };
    const busData = busRes.ok ? await busRes.json() : { result: { station: [] } };

    // 에러 응답(-98: 결과 없음)은 빈 배열로 처리
    const subwayStations: OdsayStation[] =
      subwayData.error ? [] : subwayData.result?.station ?? [];
    const busStations: OdsayStation[] =
      busData.error ? [] : busData.result?.station ?? [];

    // 지하철 우선, 버스 정류장 뒤에 배치
    const allStations = [
      ...subwayStations.map((s) => ({ ...s, kind: '지하철' as const })),
      ...busStations.map((s) => ({ ...s, kind: '버스' as const })),
    ];

    // 같은 이름+종류 중복 제거
    const seen = new Set<string>();
    const stations = allStations
      .filter((s) => {
        const key = `${s.kind}_${s.stationName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 15) // 결과 수 제한
      .map((s) => ({
        name: s.stationName,
        lat: s.y,
        lng: s.x,
        laneName: s.laneName,
        kind: s.kind,
      }));

    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json({ error: '역 검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
