'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants';

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/routes');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '경로 탐색 실패');
      }

      const data = await res.json();

      localStorage.setItem(
        STORAGE_KEYS.ROUTE_CONFIG,
        JSON.stringify({
          routes: data.routes,
          cachedAt: new Date().toISOString(),
        }),
      );

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearCache() {
    localStorage.removeItem(STORAGE_KEYS.ROUTE_CONFIG);
    setError(null);
  }

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">경로 설정</h1>
        <p className="text-sm text-gray-500 mt-1">
          학동역 → 여의도역 경로를 탐색합니다
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">출발</p>
              <p className="text-xs text-gray-500">학동역</p>
            </div>
          </div>
          <div className="ml-1.5 border-l-2 border-dashed border-gray-200 h-4" />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">도착</p>
              <p className="text-xs text-gray-500">여의도역</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium text-sm
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isLoading ? '탐색 중...' : '경로 탐색'}
        </button>

        <button
          onClick={handleClearCache}
          className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm
                     hover:bg-gray-200 transition-colors"
        >
          캐시 초기화
        </button>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
