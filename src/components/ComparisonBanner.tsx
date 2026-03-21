'use client';

import type { RouteOption } from '@/types/route';

interface ComparisonBannerProps {
  winner: RouteOption;
  loser: RouteOption;
  timeDiffMin: number;
}

export default function ComparisonBanner({
  winner,
  loser,
  timeDiffMin,
}: ComparisonBannerProps) {
  const fareDiff = loser.totalFare - winner.totalFare;
  const transferDiff = loser.transferCount - winner.transferCount;

  return (
    <div className="glass-strong rounded-2xl px-4 py-4">
      {/* 시간차 대형 숫자 */}
      <p className="text-center mb-3">
        <span className="text-[28px] font-extrabold text-gradient-warm leading-none tabular-nums">
          {timeDiffMin}분
        </span>
        <span className="text-white/70 text-sm font-medium ml-1.5">
          더 빠름
        </span>
      </p>

      {/* 핵심 지표 대비 행 */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[13px] text-white/60">
        <span className="flex items-center gap-1">
          <span className="text-[11px] text-white/35 font-medium">소요</span>
          <span className="text-white/90 font-semibold">{winner.estimatedTotalTime}분</span>
          <span className="text-white/30">vs</span>
          <span className="text-white/50">{loser.estimatedTotalTime}분</span>
        </span>

        <span className="flex items-center gap-1">
          <span className="text-[11px] text-white/35 font-medium">요금</span>
          {fareDiff === 0 ? (
            <span className="text-white/70">동일</span>
          ) : (
            <>
              <span className="text-white/90 font-semibold">
                {winner.totalFare.toLocaleString()}원
              </span>
              <span className="text-white/30">vs</span>
              <span className="text-white/50">
                {loser.totalFare.toLocaleString()}원
              </span>
            </>
          )}
        </span>

        <span className="flex items-center gap-1">
          <span className="text-[11px] text-white/35 font-medium">환승</span>
          {transferDiff === 0 ? (
            <span className="text-white/70">동일</span>
          ) : (
            <>
              <span className="text-white/90 font-semibold">
                {winner.transferCount}회
              </span>
              <span className="text-white/30">vs</span>
              <span className="text-white/50">
                {loser.transferCount}회
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
