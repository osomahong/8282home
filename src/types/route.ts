/** 교통 수단 타입 */
export type TransportType = 'subway' | 'bus' | 'walk';

/** 실시간 도착 정보 (정규화된 형태) */
export interface NormalizedArrival {
  /** 도착까지 남은 초 */
  remainingSec: number;
  /** 도착 예정 시각 (ISO string) */
  estimatedAt: string;
  /** 노선/호선 이름 (예: "7호선", "360번") */
  lineName: string;
  /** 목적지/행선지 */
  destination: string;
  /** 현재 위치 메시지 (예: "학동 도착") */
  statusMessage: string;
}

/** 경로의 개별 구간 */
export interface RouteSegment {
  /** 구간 순서 (0-based) */
  index: number;
  /** 교통 수단 */
  type: TransportType;
  /** 노선/호선 이름 */
  lineName: string;
  /** 출발 정류장/역 이름 */
  startName: string;
  /** 도착 정류장/역 이름 */
  endName: string;
  /** 정류장/역 ID (API 호출용) */
  startStationId: string;
  /** 탑승 시간 (분) — ODsay 제공 */
  ridingTime: number;
  /** 배차 간격 (분) — 추정 대기시간 계산용 */
  headway: number;
  /** 실시간 도착 정보 (첫 구간만 채워짐) */
  realtimeArrival?: NormalizedArrival | null;
  /** 서울/경기 구분 (버스만 해당) */
  regionType?: 'seoul' | 'gyeonggi';
  /** ODsay 제공 구간 거리 (미터) */
  distance?: number;
}

/** 하나의 완성된 경로 */
export interface RouteOption {
  /** 경로 고유 ID (ODsay pathType 등) */
  id: string;
  /** 경로 이름 (예: "7호선 → 9호선") */
  name: string;
  /** 총 소요시간 (분) — ODsay 기본값 */
  baseTotalTime: number;
  /** 실시간 반영 총 소요시간 (분) */
  estimatedTotalTime: number;
  /** 예상 도착 시각 (ISO string) */
  estimatedArrivalAt: string;
  /** 구간 목록 */
  segments: RouteSegment[];
  /** 총 환승 횟수 */
  transferCount: number;
  /** 총 요금 (원) */
  totalFare: number;
}

/** 경로 비교 결과 */
export interface RouteComparison {
  /** 비교 대상 경로들 */
  routes: RouteOption[];
  /** 가장 빠른 경로 ID */
  winnerId: string;
  /** 차이 (분) */
  timeDiffMin: number;
  /** 마지막 갱신 시각 (ISO string) */
  updatedAt: string;
}

/** 사용자 프로필 (경로 설정) */
export interface UserProfile {
  id: string;
  name: string;
  origin: { name: string; lat: number; lng: number };
  dest: { name: string; lat: number; lng: number };
  createdAt: string;
}

/** 저장된 경로 설정 */
export interface SavedRouteConfig {
  /** 출발지 이름 */
  originName: string;
  /** 도착지 이름 */
  destName: string;
  /** 출발지 좌표 */
  originCoord: { lat: number; lng: number };
  /** 도착지 좌표 */
  destCoord: { lat: number; lng: number };
  /** 선택된 경로 옵션들 (ODsay 원본 데이터) */
  routes: RouteOption[];
  /** 캐시 만료 시각 (ISO string) */
  cachedAt: string;
}

/** ODsay 경로탐색 API 응답 (간소화) */
export interface OdsaySearchResponse {
  result: {
    searchType: number;
    outTrafficCheck: number;
    busCount: number;
    subwayCount: number;
    busStationCount: number;
    subwayStationCount: number;
    path: OdsayPath[];
  };
}

export interface OdsayPath {
  pathType: number; // 1: 지하철, 2: 버스, 3: 버스+지하철
  info: {
    trafficDistance: number;
    totalTime: number;
    payment: number;
    busTransitCount: number;
    subwayTransitCount: number;
    firstStartStation: string;
    lastEndStation: string;
  };
  subPath: OdsaySubPath[];
}

export interface OdsaySubPath {
  trafficType: number; // 1: 지하철, 2: 버스, 3: 도보
  distance: number;
  sectionTime: number;
  stationCount?: number;
  lane?: {
    name: string;
    busNo?: string;
    subwayCode?: number;
    busCityCode?: number;
    busLocalBlID?: string;
  }[];
  startName?: string;
  endName?: string;
  startID?: number;
  endID?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  way?: string;
  wayCode?: number;
  startLocalStationID?: string;
  endLocalStationID?: string;
}
