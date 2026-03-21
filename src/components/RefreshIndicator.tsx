'use client';

import { useState, useEffect } from 'react';
import { POLLING_INTERVAL } from '@/lib/constants';

interface RefreshIndicatorProps {
  updatedAt: string;
}

export default function RefreshIndicator({ updatedAt }: RefreshIndicatorProps) {
  const [secondsLeft, setSecondsLeft] = useState(POLLING_INTERVAL / 1000);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setSecondsLeft(POLLING_INTERVAL / 1000);
  }, [updatedAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex items-center gap-2.5">
      {/* 현재 시간 */}
      <div className="text-right">
        <p className="text-[11px] text-white/35 leading-none">현재 시간 기준</p>
        <p className="text-[13px] font-semibold text-white/70 tabular-nums leading-tight mt-0.5">
          {timeStr}
        </p>
      </div>

      {/* 새로고침 카운트다운 */}
      <div className="flex items-center gap-1">
        <div className="relative w-5 h-5">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="rgba(96,165,250,0.7)"
              strokeWidth="2"
              strokeDasharray={`${(secondsLeft / (POLLING_INTERVAL / 1000)) * 50.3} 50.3`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
        </div>
        <span className="text-[11px] text-white/50 tabular-nums w-5">
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}
