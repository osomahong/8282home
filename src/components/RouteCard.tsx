'use client';

import { useState, useEffect } from 'react';
import type { RouteOption } from '@/types/route';
import { formatTime } from '@/lib/normalizer';
import TimelineBar from './TimelineBar';
import SegmentDetail from './SegmentDetail';

interface ComparisonDiff {
  timeDiffMin: number;
  fareDiff: number;
  transferDiff: number;
}

interface RouteCardProps {
  route: RouteOption;
  isWinner: boolean;
  rank: number;
  comparisonDiff?: ComparisonDiff;
}

function useCountdown(initialSec: number | undefined) {
  const [remaining, setRemaining] = useState(initialSec ?? 0);

  useEffect(() => {
    if (initialSec == null) return;
    setRemaining(initialSec);
  }, [initialSec]);

  useEffect(() => {
    if (initialSec == null) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [initialSec]);

  if (initialSec == null) return null;
  return remaining;
}

function formatCountdown(sec: number): string {
  if (sec <= 0) return '곧 도착';
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min === 0) return `${s}초`;
  return `${min}분 ${s.toString().padStart(2, '0')}초`;
}

export default function RouteCard({
  route,
  isWinner,
  rank,
  comparisonDiff,
}: RouteCardProps) {
  const [expanded, setExpanded] = useState(true);
  const transitSegments = route.segments.filter((s) => s.type !== 'walk');
  const lastSegment = transitSegments[transitSegments.length - 1];
  const firstTransit = transitSegments[0];
  const arrival = firstTransit?.realtimeArrival;

  // 탑승까지 카운트다운
  const countdown = useCountdown(arrival ? arrival.remainingSec : undefined);

  // 앞뒤 도보 제거, 중간 환승 도보만 유지
  const displaySegments = route.segments.filter((seg, i, arr) => {
    if (seg.type !== 'walk') return true;
    const hasPrevTransit = arr.slice(0, i).some((s) => s.type !== 'walk');
    const hasNextTransit = arr.slice(i + 1).some((s) => s.type !== 'walk');
    return hasPrevTransit && hasNextTransit;
  });

  const cardClass = isWinner
    ? 'glass-winner winner-glow'
    : 'glass-dimmed';

  return (
    <div
      className={`rounded-3xl overflow-hidden card-interactive relative ${cardClass}`}
    >
      {/* 좌측 세로 액센트 바 (승자만) */}
      {isWinner && (
        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400" />
      )}

      <div className="px-4 pt-4 pb-3">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-3">
          {isWinner ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              최적
            </span>
          ) : (
            <span className="text-[13px] font-medium text-white/40">
              경로 {rank}
            </span>
          )}
          {!isWinner && comparisonDiff && comparisonDiff.timeDiffMin > 0 && (
            <span className="diff-badge-slow">
              +{comparisonDiff.timeDiffMin}분 느림
            </span>
          )}
        </div>

        {/* 탑승 카운트다운 배너 */}
        {countdown != null && (
          <div className={`rounded-xl px-3 py-2.5 mb-3 ${
            isWinner ? 'bg-green-500/10 border border-green-400/15' : 'bg-white/5 border border-white/8'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[12px] ${isWinner ? 'text-green-400/60' : 'text-white/35'}`}>
                  탑승까지
                </p>
                <p className={`text-[20px] font-bold tabular-nums leading-tight ${
                  isWinner ? 'realtime-glow' : 'text-white/70'
                }`}>
                  {formatCountdown(countdown)}
                </p>
              </div>
              {firstTransit && firstTransit.headway > 0 && (
                <div className="text-right">
                  <p className={`text-[11px] ${isWinner ? 'text-white/35' : 'text-white/25'}`}>
                    놓치면
                  </p>
                  <p className="text-[13px] font-medium text-amber-400/70 tabular-nums">
                    +{firstTransit.headway}분 대기
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 총 소요시간 — 수직 3행 */}
        <div className="mb-4 space-y-1">
          {/* 1행: 소요시간 (크게) */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-extrabold leading-none tabular-nums ${
                isWinner
                  ? 'text-[36px] text-gradient'
                  : 'text-[28px] text-white/60'
              }`}
            >
              {route.estimatedTotalTime}
            </span>
            <span
              className={`font-bold ${
                isWinner ? 'text-[16px] text-white' : 'text-[14px] text-white/50'
              }`}
            >
              분
            </span>
          </div>

          {/* 2행: 도착 시각 */}
          <p className={`text-[14px] ${isWinner ? 'text-white/70' : 'text-white/45'}`}>
            {formatTime(route.estimatedArrivalAt)} 도착
          </p>

          {/* 3행: 요금 · 환승 */}
          <p className={`text-[13px] ${isWinner ? 'text-white/50' : 'text-white/35'}`}>
            {route.totalFare.toLocaleString()}원
            {!isWinner && comparisonDiff && comparisonDiff.fareDiff > 0 && (
              <span className="text-red-400/80 ml-1">
                (+{comparisonDiff.fareDiff.toLocaleString()}원)
              </span>
            )}
            <span className="mx-1.5">&middot;</span>
            환승 {route.transferCount}회
            {!isWinner && comparisonDiff && comparisonDiff.transferDiff > 0 && (
              <span className="text-red-400/80 ml-1">
                (+{comparisonDiff.transferDiff}회)
              </span>
            )}
          </p>
        </div>

        {/* 타임라인 바 */}
        <TimelineBar segments={route.segments} />

        {/* 구간 상세 */}
        {expanded && (
          <div className="mt-3 divide-y divide-white/10">
            {displaySegments.map((seg) => {
              const isFirstTransit =
                seg.type !== 'walk' &&
                seg.index === transitSegments[0]?.index;
              return (
                <SegmentDetail
                  key={seg.index}
                  segment={seg}
                  isFirst={isFirstTransit}
                />
              );
            })}

            {/* 하차 */}
            {lastSegment && (
              <div className="flex items-center gap-3 py-3">
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 inline-block" />
                  <span className="text-sm font-bold text-white/50">
                    하차
                  </span>
                </div>
                <span className="text-[15px] font-medium text-white">
                  {lastSegment.endName}역
                </span>
              </div>
            )}
          </div>
        )}

        {/* 상세보기 토글 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[13px] text-white/40 hover:text-white/70 transition-colors"
        >
          {expanded ? '접기' : '상세보기'}
          <svg
            className={`w-3 h-3 chevron-rotate ${expanded ? 'open' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
