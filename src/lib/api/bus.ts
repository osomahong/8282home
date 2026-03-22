import type { NormalizedArrival } from '@/types/route';

const SEOUL_BUS_BASE = 'http://ws.bus.go.kr/api/rest/stationinfo';

/**
 * 서울시 버스 도착정보 API (정류소별 도착예정 버스)
 * arsId: 정류소 고유번호
 */
export async function getSeoulBusArrival(
  arsId: string,
): Promise<NormalizedArrival[]> {
  const apiKey = process.env.SEOUL_BUS_API_KEY?.trim();
  if (!apiKey) throw new Error('SEOUL_BUS_API_KEY가 설정되지 않았습니다.');

  const params = new URLSearchParams({
    serviceKey: apiKey,
    arsId,
    resultType: 'json',
  });

  const res = await fetch(`${SEOUL_BUS_BASE}/getStationByUid?${params}`);
  if (!res.ok) {
    throw new Error(`서울버스 API error: ${res.status}`);
  }

  const data = await res.json();
  const items = data?.msgBody?.itemList;
  if (!items || !Array.isArray(items)) return [];

  return items.map(
    (item: Record<string, string | number>): NormalizedArrival => ({
      remainingSec: Number(item.traTime1 ?? 0) * 60,
      estimatedAt: new Date(
        Date.now() + Number(item.traTime1 ?? 0) * 60 * 1000,
      ).toISOString(),
      lineName: String(item.rtNm ?? ''),
      destination: String(item.adirection ?? ''),
      statusMessage: String(item.arrmsg1 ?? ''),
    }),
  );
}

/**
 * 특정 노선의 도착 정보만 필터링
 */
export function filterByBusNo(
  arrivals: NormalizedArrival[],
  busNo: string,
): NormalizedArrival | null {
  return (
    arrivals.find(
      (a) => a.lineName === busNo || a.lineName.replace(/\s/g, '') === busNo,
    ) ?? null
  );
}
