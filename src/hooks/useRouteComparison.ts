'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { RouteOption, RouteComparison, NormalizedArrival } from '@/types/route';
import { calculateEstimatedTime, compareRoutes } from '@/lib/calculator';
import { matchArrivalToSegment } from '@/lib/normalizer';
import { POLLING_INTERVAL, ROUTE_CACHE_TTL, routeCacheKey } from '@/lib/constants';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface UseRouteComparisonOptions {
  profileId: string;
  origin: Location;
  dest: Location;
}

function buildFetchRoutes(profileId: string, origin: Location, dest: Location) {
  return async function fetchRoutes(): Promise<RouteOption[]> {
    const cacheKey = routeCacheKey(profileId);

    // localStorage 캐시 확인
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - new Date(parsed.cachedAt).getTime() < ROUTE_CACHE_TTL) {
            return parsed.routes;
          }
        } catch {
          // 캐시 파싱 실패 — 무시하고 새로 조회
        }
      }
    }

    const params = new URLSearchParams({
      originLng: String(origin.lng),
      originLat: String(origin.lat),
      destLng: String(dest.lng),
      destLat: String(dest.lat),
    });

    const res = await fetch(`/api/routes?${params}`);
    if (!res.ok) throw new Error('경로 탐색 실패');
    const data = await res.json();
    const routes: RouteOption[] = data.routes;

    // 캐시 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ routes, cachedAt: new Date().toISOString() }),
      );
    }

    return routes;
  };
}

async function fetchRealtimeForSegment(
  type: string,
  stationId: string,
  stationName: string,
): Promise<NormalizedArrival[]> {
  if (type === 'bus') {
    const res = await fetch(`/api/bus?arsId=${stationId}`);
    if (!res.ok) return [];
    return (await res.json()).arrivals ?? [];
  }
  if (type === 'subway') {
    const res = await fetch(`/api/subway?station=${encodeURIComponent(stationName)}`);
    if (!res.ok) return [];
    return (await res.json()).arrivals ?? [];
  }
  return [];
}

/**
 * 경로 비교의 핵심 훅.
 * 1. 경로 탐색 (ODsay) — 캐시 + 1일 유효
 * 2. 각 경로의 첫 구간 실시간 정보 — 30초 polling
 * 3. 총 소요시간 재계산 + 승자 판정
 */
export function useRouteComparison(options: UseRouteComparisonOptions) {
  const { profileId, origin, dest } = options;

  // 1. 경로 탐색
  const routesQuery = useQuery<RouteOption[]>({
    queryKey: ['routes', profileId],
    queryFn: buildFetchRoutes(profileId, origin, dest),
    staleTime: ROUTE_CACHE_TTL,
    refetchOnWindowFocus: false,
  });

  const routes = routesQuery.data ?? [];

  // 2. 각 경로의 첫 번째 교통 구간(walk 제외) 실시간 정보를 병렬 조회
  const firstSegments = routes
    .map((r) => r.segments.find((s) => s.type !== 'walk'))
    .filter((s): s is NonNullable<typeof s> => !!s);

  // 중복 제거 (같은 역/정류장이면 1회만 호출)
  const uniqueStations = useMemo(() => {
    const seen = new Set<string>();
    return firstSegments.filter((seg) => {
      const key = `${seg.type}_${seg.startStationId}_${seg.startName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [firstSegments]);

  const realtimeQueries = useQueries({
    queries: uniqueStations.map((seg) => ({
      queryKey: ['realtime', seg.type, seg.startStationId, seg.startName],
      queryFn: () =>
        fetchRealtimeForSegment(seg.type, seg.startStationId, seg.startName),
      refetchInterval: POLLING_INTERVAL,
      refetchIntervalInBackground: false,
      staleTime: POLLING_INTERVAL,
      enabled: routes.length > 0,
    })),
  });

  // 3. 실시간 반영 + 재계산
  const comparison = useMemo<RouteComparison | null>(() => {
    if (routes.length === 0) return null;

    // 실시간 데이터를 station key → arrivals 맵으로
    const arrivalMap = new Map<string, NormalizedArrival[]>();
    uniqueStations.forEach((seg, i) => {
      const key = `${seg.type}_${seg.startStationId}_${seg.startName}`;
      arrivalMap.set(key, realtimeQueries[i]?.data ?? []);
    });

    const updatedRoutes = routes.map((route) => {
      const firstTransitIdx = route.segments.findIndex((s) => s.type !== 'walk');
      const firstSeg = firstTransitIdx >= 0 ? route.segments[firstTransitIdx] : null;
      if (!firstSeg) return route;

      const key = `${firstSeg.type}_${firstSeg.startStationId}_${firstSeg.startName}`;
      const arrivals = arrivalMap.get(key) ?? [];
      const matched = matchArrivalToSegment(firstSeg, arrivals);

      const updatedSegments = route.segments.map((seg, i) =>
        i === firstTransitIdx ? { ...seg, realtimeArrival: matched } : seg,
      );

      const updatedRoute = { ...route, segments: updatedSegments };
      const { estimatedTotalTime, estimatedArrivalAt } =
        calculateEstimatedTime(updatedRoute);

      return { ...updatedRoute, estimatedTotalTime, estimatedArrivalAt };
    });

    const { winnerId, timeDiffMin } = compareRoutes(updatedRoutes);

    return {
      routes: updatedRoutes,
      winnerId,
      timeDiffMin,
      updatedAt: new Date().toISOString(),
    };
  }, [routes, uniqueStations, realtimeQueries]);

  const isLoading =
    routesQuery.isLoading ||
    realtimeQueries.some((q) => q.isLoading);

  const isError =
    routesQuery.isError ||
    realtimeQueries.some((q) => q.isError);

  const error = routesQuery.error ?? realtimeQueries.find((q) => q.error)?.error;

  return {
    comparison,
    isLoading,
    isError,
    error,
    refetch: routesQuery.refetch,
  };
}
