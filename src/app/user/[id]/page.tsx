'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useRouteComparison } from '@/hooks/useRouteComparison';
import RouteCard from '@/components/RouteCard';
import ComparisonBanner from '@/components/ComparisonBanner';
import RefreshIndicator from '@/components/RefreshIndicator';
import { fetchProfile } from '@/lib/profiles';

export default function UserRoutePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const profileQuery = useQuery({
    queryKey: ['profile', params.id],
    queryFn: () => fetchProfile(params.id),
    staleTime: 60_000,
  });

  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-4 py-20 flex justify-center">
        <div className="w-6 h-6 spinner-gradient rounded-full animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-4 py-20 text-center">
        <p className="text-white/60 text-sm">경로를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-blue-400 text-sm underline"
        >
          홈으로 돌아가기
        </button>
      </main>
    );
  }

  return <RouteView profileId={profile.id} origin={profile.origin} dest={profile.dest} profileName={profile.name} />;
}

function RouteView({
  profileId,
  origin,
  dest,
  profileName,
}: {
  profileId: string;
  origin: { name: string; lat: number; lng: number };
  dest: { name: string; lat: number; lng: number };
  profileName: string;
}) {
  const router = useRouter();
  const { comparison, isLoading, isError, error } = useRouteComparison({
    profileId,
    origin,
    dest,
  });

  const comparisonData = useMemo(() => {
    if (!comparison || comparison.routes.length < 2) return null;

    const winner = comparison.routes.find((r) => r.id === comparison.winnerId)!;
    const losers = comparison.routes.filter((r) => r.id !== comparison.winnerId);
    const slowest = losers.reduce((a, b) =>
      a.estimatedTotalTime > b.estimatedTotalTime ? a : b
    );

    const diffs = new Map(
      comparison.routes.map((route) => [
        route.id,
        {
          timeDiffMin: route.estimatedTotalTime - winner.estimatedTotalTime,
          fareDiff: route.totalFare - winner.totalFare,
          transferDiff: route.transferCount - winner.transferCount,
        },
      ])
    );

    return { winner, slowest, diffs };
  }, [comparison]);

  return (
    <main className="relative z-10 flex-1 max-w-md mx-auto w-full">
      <header className="sticky top-0 z-10 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-white/50 hover:text-white/80 transition-colors"
              aria-label="뒤로가기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{profileName}</h1>
              <p className="text-xs text-white/40 mt-0.5">
                {origin.name} → {dest.name}
              </p>
            </div>
          </div>
          {comparison && (
            <RefreshIndicator updatedAt={comparison.updatedAt} />
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 spinner-gradient rounded-full animate-spin" />
            <p className="text-sm text-white/40">경로 탐색 중...</p>
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-4 text-center border-red-400/30">
            <p className="text-red-300 font-medium text-sm">
              {error instanceof Error ? error.message : '오류가 발생했습니다'}
            </p>
            <p className="text-red-400/50 text-xs mt-1">
              API 키를 확인해 주세요
            </p>
          </div>
        )}

        {comparison && comparisonData && (
          <>
            {comparison.timeDiffMin > 0 && (
              <ComparisonBanner
                winner={comparisonData.winner}
                loser={comparisonData.slowest}
                timeDiffMin={comparison.timeDiffMin}
              />
            )}

            {comparison.routes.map((route, idx) => (
              <RouteCard
                key={route.id}
                route={route}
                isWinner={route.id === comparison.winnerId}
                rank={idx + 1}
                comparisonDiff={comparisonData.diffs.get(route.id)}
              />
            ))}
          </>
        )}

        {comparison && !comparisonData && (
          <>
            {comparison.routes.map((route, idx) => (
              <RouteCard
                key={route.id}
                route={route}
                isWinner={true}
                rank={idx + 1}
              />
            ))}
          </>
        )}
      </div>
    </main>
  );
}
