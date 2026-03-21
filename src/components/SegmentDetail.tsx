'use client';

import { useState, useEffect } from 'react';
import type { RouteSegment } from '@/types/route';
import { getSegmentColor, extractLineNumber, getBusTypeName, isExpress } from '@/lib/colors';

interface SegmentDetailProps {
  segment: RouteSegment;
  isFirst: boolean;
}

/** 실시간 remainingSec을 1초마다 감소시키는 카운트다운 */
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

/** 지하철 아이콘 (SVG) */
function SubwayIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="14" rx="3" />
      <path d="M4 11h16" />
      <circle cx="8.5" cy="15" r="0.5" fill="currentColor" />
      <circle cx="15.5" cy="15" r="0.5" fill="currentColor" />
      <path d="M7 21l2-4" />
      <path d="M17 21l-2-4" />
    </svg>
  );
}

/** 버스 아이콘 (SVG) */
function BusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="15" rx="3" />
      <path d="M4 10h16" />
      <circle cx="8" cy="15.5" r="1" />
      <circle cx="16" cy="15.5" r="1" />
      <path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2" />
      <path d="M7 18v2" />
      <path d="M17 18v2" />
    </svg>
  );
}

/** 도보 아이콘 (SVG) */
function WalkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4.5" r="2" />
      <path d="M13.5 8.5l2 3.5-3 1 2 6" />
      <path d="M10 8.5l-2 7 3 0" />
    </svg>
  );
}

export default function SegmentDetail({ segment, isFirst }: SegmentDetailProps) {
  const color = getSegmentColor(segment);
  const arrival = segment.realtimeArrival;
  const countdown = useCountdown(isFirst && arrival ? arrival.remainingSec : undefined);

  // 도보 구간
  if (segment.type === 'walk') {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <WalkIcon className="w-3.5 h-3.5 text-white/40" />
          <span className="text-sm font-bold text-white/40">도보</span>
        </div>
        <span className="text-[14px] text-white/50">
          {segment.ridingTime}분
        </span>
      </div>
    );
  }

  if (segment.type === 'subway') {
    const lineNum = extractLineNumber(segment.lineName);
    const express = isExpress(segment.lineName);

    return (
      <div className="py-3">
        <div className="flex items-start gap-3">
          {/* 아이콘 + 호선 */}
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <SubwayIcon className="w-4 h-4 text-white/60" />
            <span className="text-sm font-bold" style={{ color }}>
              {lineNum}
            </span>
          </div>

          {/* 역 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-white">
                {segment.startName}역
              </span>
              {express && (
                <span
                  className="text-[10px] font-bold border rounded px-1 py-0.5"
                  style={{ color, borderColor: color }}
                >
                  급
                </span>
              )}
            </div>

            {/* 실시간 도착 정보 + 카운트다운 */}
            {isFirst && arrival && countdown != null && (
              <div className="mt-2 space-y-1.5">
                {/* 카운트다운 */}
                <div className="flex items-baseline gap-1.5">
                  <span className="realtime-glow font-bold text-[15px] tabular-nums">
                    {formatCountdown(countdown)}
                  </span>
                  <span className="text-[12px] text-white/40">뒤 탑승</span>
                </div>

                {/* 다음 열차 가이드 */}
                {segment.headway > 0 && (
                  <p className="text-[12px] text-white/30">
                    못 타면{' '}
                    <span className="text-amber-400/70 font-medium">+{segment.headway}분</span>
                    {' '}뒤 다음 열차
                  </p>
                )}

                {/* 행선지 */}
                <p className="text-[12px] text-white/40">
                  {arrival.destination} 방면
                </p>
              </div>
            )}

            {/* 실시간 없을 때 배차 간격 표시 */}
            {isFirst && !arrival && segment.headway > 0 && (
              <p className="mt-1.5 text-[12px] text-white/30">
                배차 약 {segment.headway}분
              </p>
            )}
          </div>

          {/* 실시간 뱃지 */}
          {isFirst && (
            <span className={`text-[11px] rounded-full px-2.5 py-1 whitespace-nowrap ${
              arrival ? 'bg-green-500/15 text-green-400/80 border border-green-400/20' : 'glass text-white/40'
            }`}>
              {arrival ? 'LIVE' : '실시간'}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (segment.type === 'bus') {
    const busType = getBusTypeName(segment.lineName);

    return (
      <div className="py-3">
        <div className="flex items-start gap-3">
          {/* 아이콘 + 유형 */}
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <BusIcon className="w-4 h-4 text-white/60" />
            <span className="text-sm font-bold" style={{ color }}>
              {busType}
            </span>
          </div>

          {/* 정류장 정보 */}
          <div className="flex-1">
            <span className="text-[15px] font-medium text-white">
              {segment.startName}
            </span>

            {/* 실시간 도착 정보 + 카운트다운 */}
            {isFirst && arrival && countdown != null && (
              <div className="mt-2 space-y-1.5">
                {/* 노선명 */}
                <p className="text-[13px] font-bold text-white">
                  {segment.lineName}번
                </p>

                {/* 카운트다운 */}
                <div className="flex items-baseline gap-1.5">
                  <span className="realtime-glow font-bold text-[15px] tabular-nums">
                    {formatCountdown(countdown)}
                  </span>
                  <span className="text-[12px] text-white/40">뒤 탑승</span>
                </div>

                {/* 다음 버스 가이드 */}
                {segment.headway > 0 && (
                  <p className="text-[12px] text-white/30">
                    못 타면{' '}
                    <span className="text-amber-400/70 font-medium">+{segment.headway}분</span>
                    {' '}뒤 다음 버스
                  </p>
                )}

                {/* 현재 위치 */}
                {arrival.statusMessage && (
                  <p className="text-[12px] text-white/40">
                    {arrival.statusMessage}
                  </p>
                )}
              </div>
            )}

            {/* 실시간 없을 때 배차 간격 표시 */}
            {isFirst && !arrival && segment.headway > 0 && (
              <p className="mt-1.5 text-[12px] text-white/30">
                배차 약 {segment.headway}분
              </p>
            )}
          </div>

          {/* 실시간 뱃지 */}
          {isFirst && (
            <span className={`text-[11px] rounded-full px-2.5 py-1 whitespace-nowrap ${
              arrival ? 'bg-green-500/15 text-green-400/80 border border-green-400/20' : 'glass text-white/40'
            }`}>
              {arrival ? 'LIVE' : '도착정보'}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
