import { SUBWAY_COLORS, BUS_COLORS } from './constants';
import type { RouteSegment } from '@/types/route';

/**
 * ODsay lineName에서 호선 번호를 추출합니다.
 * "수도권 7호선" → "7호선", "수도권 9호선(급행)" → "9호선"
 */
export function extractLineNumber(lineName: string): string {
  const match = lineName.match(/(\d+호선)/);
  if (match) return match[1];
  // 경의중앙선, 공항철도 등
  for (const key of Object.keys(SUBWAY_COLORS)) {
    if (lineName.includes(key)) return key;
  }
  return lineName;
}

/**
 * 구간에 해당하는 색상을 반환합니다.
 */
export function getSegmentColor(segment: RouteSegment): string {
  if (segment.type === 'walk') return '#999999';

  if (segment.type === 'subway') {
    const line = extractLineNumber(segment.lineName);
    return SUBWAY_COLORS[line] ?? '#666666';
  }

  if (segment.type === 'bus') {
    // 버스 번호로 유형 추정
    const busNo = segment.lineName;
    if (/^\d{3}$/.test(busNo)) return BUS_COLORS['간선']; // 3자리: 간선
    if (/^\d{4}$/.test(busNo)) return BUS_COLORS['지선']; // 4자리: 지선
    if (/^9\d{3}$/.test(busNo)) return BUS_COLORS['광역']; // 9xxx: 광역
    if (busNo.includes('마을')) return BUS_COLORS['마을'];
    return BUS_COLORS['default'];
  }

  return '#999999';
}

/**
 * 버스 유형 이름을 반환합니다.
 */
export function getBusTypeName(busNo: string): string {
  if (/^\d{3}$/.test(busNo)) return '간선';
  if (/^\d{4}$/.test(busNo)) return '지선';
  if (/^9\d{3}$/.test(busNo)) return '광역';
  if (busNo.includes('마을')) return '마을';
  return '일반';
}

/**
 * 지하철 "급행" 여부를 판별합니다.
 */
export function isExpress(lineName: string): boolean {
  return lineName.includes('급행');
}
