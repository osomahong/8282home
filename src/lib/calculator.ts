import type { RouteOption } from '@/types/route';

/**
 * 실시간 정보를 반영하여 경로의 총 소요시간을 재계산합니다.
 *
 * 전략:
 * - 도보 구간: ODsay 제공 시간 그대로 사용
 * - 첫 번째 탑승 구간: 실시간 대기시간 + 탑승시간
 * - 이후 탑승 구간: 배차간격/2 (평균 대기시간) + 탑승시간
 */
export function calculateEstimatedTime(route: RouteOption): {
  estimatedTotalTime: number;
  estimatedArrivalAt: string;
} {
  const { segments } = route;
  let totalMinutes = 0;
  let isFirstTransit = true;

  for (const seg of segments) {
    if (seg.type === 'walk') {
      totalMinutes += seg.ridingTime;
      continue;
    }

    // 대기 시간
    if (isFirstTransit) {
      if (seg.realtimeArrival) {
        totalMinutes += Math.ceil(seg.realtimeArrival.remainingSec / 60);
      } else if (seg.headway > 0) {
        totalMinutes += Math.ceil(seg.headway / 2);
      }
      isFirstTransit = false;
    } else {
      // 환승 대기 — walk 구간이 이미 포함되어 있으므로 별도 환승 도보 추가 안 함
      if (seg.headway > 0) {
        totalMinutes += Math.ceil(seg.headway / 2);
      }
    }

    totalMinutes += seg.ridingTime;
  }

  const estimatedArrivalAt = new Date(
    Date.now() + totalMinutes * 60 * 1000,
  ).toISOString();

  return { estimatedTotalTime: totalMinutes, estimatedArrivalAt };
}

/**
 * 여러 경로를 비교하여 승자를 판정합니다.
 */
export function compareRoutes(routes: RouteOption[]): {
  winnerId: string;
  timeDiffMin: number;
} {
  if (routes.length === 0) {
    return { winnerId: '', timeDiffMin: 0 };
  }

  const sorted = [...routes].sort(
    (a, b) => a.estimatedTotalTime - b.estimatedTotalTime,
  );

  const winner = sorted[0];
  const runnerUp = sorted[1];

  return {
    winnerId: winner.id,
    timeDiffMin: runnerUp
      ? runnerUp.estimatedTotalTime - winner.estimatedTotalTime
      : 0,
  };
}
