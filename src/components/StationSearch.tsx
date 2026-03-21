'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Station {
  name: string;
  lat: number;
  lng: number;
  laneName?: string;
  kind?: '지하철' | '버스';
}

interface StationSearchProps {
  label: string;
  placeholder?: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
}

export default function StationSearch({ label, placeholder, value, onChange }: StationSearchProps) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (keyword: string) => {
    if (keyword.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stations?q=${encodeURIComponent(keyword.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '검색에 실패했습니다.');
        setResults([]);
      } else if (data.stations.length === 0) {
        setError(`"${keyword.trim()}" 역/정류장을 찾을 수 없습니다.`);
        setResults([]);
      } else {
        setResults(data.stations);
        setError(null);
      }
      setIsOpen(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setResults([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    // 선택된 값 해제
    if (value) onChange(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(station: Station) {
    setQuery(station.name);
    onChange(station);
    setIsOpen(false);
    setError(null);
  }

  function handleClear() {
    setQuery('');
    onChange(null);
    setResults([]);
    setIsOpen(false);
    setError(null);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-white/40 block mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0 && !value) setIsOpen(true); }}
          placeholder={placeholder ?? '역/정류장 이름 검색'}
          className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors pr-8 ${
            value
              ? 'border-green-400/30 bg-green-500/5'
              : error
                ? 'border-red-400/30'
                : 'border-white/10 focus:border-white/30'
          }`}
        />
        {/* 상태 아이콘 */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
          )}
          {!isLoading && value && (
            <button onClick={handleClear} className="text-white/30 hover:text-white/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && !isOpen && (
        <p className="text-[11px] text-red-400/80 mt-1">{error}</p>
      )}

      {/* 선택 완료 */}
      {value && (
        <p className="text-[11px] text-green-400/60 mt-1">
          {value.name}{value.kind ? ` (${value.kind})` : ''} 선택됨
        </p>
      )}

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full glass rounded-xl overflow-hidden border border-white/10 max-h-[200px] overflow-y-auto">
          {error && (
            <p className="px-3 py-3 text-[13px] text-red-400/80">{error}</p>
          )}
          {results.map((station, i) => (
            <button
              key={`${station.kind}_${station.name}_${i}`}
              onClick={() => handleSelect(station)}
              className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium">{station.name}</p>
                {station.kind && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    station.kind === '지하철'
                      ? 'bg-blue-500/15 text-blue-400/80'
                      : 'bg-green-500/15 text-green-400/80'
                  }`}>
                    {station.kind}
                  </span>
                )}
              </div>
              {station.laneName && (
                <p className="text-[11px] text-white/35 mt-0.5">{station.laneName}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
