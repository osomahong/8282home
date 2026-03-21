import type { NormalizedArrival } from '@/types/route';

const SEOUL_SUBWAY_BASE = 'http://swopenapi.seoul.go.kr/api/subway';

/** subwayId → 호선 이름 매핑 */
const SUBWAY_LINE_MAP: Record<string, string> = {
  '1001': '1호선',
  '1002': '2호선',
  '1003': '3호선',
  '1004': '4호선',
  '1005': '5호선',
  '1006': '6호선',
  '1007': '7호선',
  '1008': '8호선',
  '1009': '9호선',
  '1063': '경의중앙선',
  '1065': '공항철도',
  '1067': '경춘선',
  '1075': '수인분당선',
  '1077': '신분당선',
};

/**
 * 서울교통공사 실시간 지하철 도착정보 API
 */
export async function getSubwayArrival(
  stationName: string,
): Promise<NormalizedArrival[]> {
  const apiKey = process.env.SEOUL_SUBWAY_API_KEY;
  if (!apiKey) throw new Error('SEOUL_SUBWAY_API_KEY가 설정되지 않았습니다.');

  // 역 이름에서 "역" 접미사 제거
  const name = stationName.replace(/역$/, '');

  const url = `${SEOUL_SUBWAY_BASE}/${apiKey}/json/realtimeStationArrival/0/10/${encodeURIComponent(name)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`지하철 API error: ${res.status}`);
  }

  const data = await res.json();

  // 에러 응답 처리
  if (data.errorMessage && data.errorMessage.code !== 'INFO-000') {
    throw new Error(`지하철 API: ${data.errorMessage.message}`);
  }

  const items = data?.realtimeArrivalList;
  if (!items || !Array.isArray(items)) return [];

  return items.map(
    (item: Record<string, string | number>): NormalizedArrival => ({
      remainingSec: Number(item.barvlDt ?? 0),
      estimatedAt: new Date(
        Date.now() + Number(item.barvlDt ?? 0) * 1000,
      ).toISOString(),
      lineName: SUBWAY_LINE_MAP[String(item.subwayId)] ?? String(item.subwayId ?? ''),
      destination: String(item.trainLineNm ?? ''),
      statusMessage: String(item.arvlMsg2 ?? ''),
    }),
  );
}

/**
 * 특정 호선 + 방면(상행/하행) 필터링
 * direction: "상행" | "하행" (optional)
 */
export function filterByLine(
  arrivals: NormalizedArrival[],
  lineName: string,
  direction?: string,
): NormalizedArrival[] {
  return arrivals.filter((a) => {
    const lineMatch = a.lineName.includes(lineName) || lineName.includes(a.lineName);
    if (!lineMatch) return false;
    if (!direction) return true;
    return a.destination.includes(direction);
  });
}
