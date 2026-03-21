/** 학동역 좌표 (ODsay 좌표계: WGS84) */
export const ORIGIN = {
  name: '학동역',
  lat: 37.51437,
  lng: 127.03171,
} as const;

/** 여의도역 좌표 */
export const DEST = {
  name: '여의도역',
  lat: 37.52163,
  lng: 126.92443,
} as const;

/** 환승 도보 시간 (분) */
export const TRANSFER_WALK_TIME = {
  /** 지하철 ↔ 지하철 */
  subwayToSubway: 5,
  /** 지하철 ↔ 버스 */
  subwayToBus: 7,
  /** 버스 ↔ 버스 */
  busToBus: 5,
} as const;

/** Polling 간격 (ms) */
export const POLLING_INTERVAL = 30_000;

/** 경로 캐시 유효시간 (ms) — 24시간 */
export const ROUTE_CACHE_TTL = 24 * 60 * 60 * 1000;

/** 최대 비교 경로 수 */
export const MAX_ROUTES = 3;

/** 지하철 노선 색상 */
export const SUBWAY_COLORS: Record<string, string> = {
  '1호선': '#00498B',
  '2호선': '#009246',
  '3호선': '#EF7C1C',
  '4호선': '#00A5DE',
  '5호선': '#996CAC',
  '6호선': '#CD7C2F',
  '7호선': '#747F00',
  '8호선': '#E6186C',
  '9호선': '#BDB092',
  '경의중앙선': '#77C4A3',
  '공항철도': '#0090D2',
  '경춘선': '#33A23D',
  '수인분당선': '#FABE00',
  '신분당선': '#DB0029',
};

/** 버스 유형 색상 */
export const BUS_COLORS: Record<string, string> = {
  간선: '#3D5BAB',
  지선: '#55A532',
  광역: '#E23030',
  마을: '#55A532',
  default: '#3D5BAB',
};

/** localStorage 키 (사용자별 캐시는 접미사 사용) */
export const STORAGE_KEYS = {
  ROUTE_CONFIG: 'ddakdochak_route_config',
  SETTINGS: 'ddakdochak_settings',
} as const;

/** 사용자별 경로 캐시 키 */
export function routeCacheKey(profileId: string) {
  return `ddakdochak_route_config_${profileId}`;
}
