import type { NormalizedArrival, RouteSegment } from '@/types/route';
import { filterByBusNo } from './api/bus';

/**
 * 실시간 도착 정보 목록에서 해당 구간에 맞는 정보를 찾아 반환합니다.
 */
export function matchArrivalToSegment(
  segment: RouteSegment,
  arrivals: NormalizedArrival[],
): NormalizedArrival | null {
  if (arrivals.length === 0) return null;

  if (segment.type === 'bus') {
    return filterByBusNo(arrivals, segment.lineName);
  }

  // 지하철: 같은 호선 중 가장 빨리 오는 열차
  // ODsay lineName ("수도권 7호선") → "7호선" 추출
  const lineNum = segment.lineName.replace(/^수도권\s*/, '').replace(/\(.*\)$/, '');
  const filtered = arrivals.filter(
    (a) => a.lineName.includes(lineNum) || lineNum.includes(a.lineName),
  );
  const candidates = filtered.length > 0 ? filtered : arrivals;
  const sorted = [...candidates].sort(
    (a, b) => a.remainingSec - b.remainingSec,
  );
  return sorted[0] ?? null;
}

/**
 * 초를 "N분 M초" 형식으로 변환합니다.
 */
export function formatSeconds(sec: number): string {
  if (sec <= 0) return '곧 도착';
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min === 0) return `${s}초`;
  if (s === 0) return `${min}분`;
  return `${min}분 ${s}초`;
}

/**
 * ISO 시각을 "HH:MM" 형식으로 변환합니다.
 */
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 교통수단 타입에 따른 이모지를 반환합니다.
 */
export function getTransportEmoji(type: 'subway' | 'bus' | 'walk'): string {
  switch (type) {
    case 'subway':
      return '🚇';
    case 'bus':
      return '🚌';
    case 'walk':
      return '🚶';
  }
}
