'use client';

import type { RouteSegment } from '@/types/route';
import { getSegmentColor } from '@/lib/colors';

interface TimelineBarProps {
  segments: RouteSegment[];
}

export default function TimelineBar({ segments }: TimelineBarProps) {
  // 앞뒤 도보 제거, 중간 환승 도보만 유지
  const displaySegments = segments.filter((seg, i, arr) => {
    if (seg.type !== 'walk') return true;
    const hasPrevTransit = arr.slice(0, i).some((s) => s.type !== 'walk');
    const hasNextTransit = arr.slice(i + 1).some((s) => s.type !== 'walk');
    return hasPrevTransit && hasNextTransit;
  });

  const totalTime = displaySegments.reduce((sum, s) => sum + s.ridingTime, 0);
  if (totalTime === 0) return null;

  return (
    <div className="flex items-center h-7 gap-px rounded-full overflow-hidden bg-white/10">
      {displaySegments.map((seg, i) => {
        const widthPercent = Math.max((seg.ridingTime / totalTime) * 100, 8);
        const color = getSegmentColor(seg);
        const isWalk = seg.type === 'walk';

        return (
          <div
            key={seg.index}
            className="timeline-segment relative h-full flex items-center justify-center overflow-hidden"
            style={{
              width: `${widthPercent}%`,
              backgroundColor: isWalk ? 'rgba(255,255,255,0.1)' : color,
              minWidth: '28px',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* 라벨 */}
            {isWalk ? (
              <span className="text-[10px] font-medium text-white/50">
                도보 {seg.ridingTime}분
              </span>
            ) : (
              <span
                className="text-[11px] font-semibold tabular-nums text-white"
              >
                {seg.ridingTime}분
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
