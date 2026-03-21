'use client';

import { useQuery } from '@tanstack/react-query';
import type { NormalizedArrival, RouteSegment } from '@/types/route';
import { POLLING_INTERVAL } from '@/lib/constants';

async function fetchBusArrival(arsId: string): Promise<NormalizedArrival[]> {
  const res = await fetch(`/api/bus?arsId=${arsId}`);
  if (!res.ok) throw new Error('버스 도착정보 조회 실패');
  const data = await res.json();
  return data.arrivals ?? [];
}

async function fetchSubwayArrival(
  station: string,
): Promise<NormalizedArrival[]> {
  const res = await fetch(`/api/subway?station=${encodeURIComponent(station)}`);
  if (!res.ok) throw new Error('지하철 도착정보 조회 실패');
  const data = await res.json();
  return data.arrivals ?? [];
}

/**
 * 특정 구간의 실시간 도착 정보를 polling합니다.
 */
export function useRealtimeArrival(
  segment: RouteSegment | undefined,
  enabled: boolean = true,
) {
  return useQuery<NormalizedArrival[]>({
    queryKey: ['realtime', segment?.type, segment?.startStationId, segment?.startName],
    queryFn: async () => {
      if (!segment) return [];

      if (segment.type === 'bus') {
        return fetchBusArrival(segment.startStationId);
      }
      if (segment.type === 'subway') {
        return fetchSubwayArrival(segment.startName);
      }
      return [];
    },
    enabled: enabled && !!segment && segment.type !== 'walk',
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: POLLING_INTERVAL,
  });
}
