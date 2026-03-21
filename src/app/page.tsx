'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types/route';
import { fetchProfiles, createProfile, removeProfile } from '@/lib/profiles';
import StationSearch from '@/components/StationSearch';

const MAX_PROFILES = 20;

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchProfiles();
    setProfiles(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  async function handleDelete(id: string) {
    const { error } = await removeProfile(id);
    if (error) { alert(error); return; }
    await loadProfiles();
  }

  const isFull = profiles.length >= MAX_PROFILES;

  return (
    <main className="relative z-10 flex-1 max-w-md mx-auto w-full">
      <header className="sticky top-0 z-10 glass px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">딱도착</h1>
            <p className="text-xs text-white/40 mt-0.5">출근 경로 비교</p>
          </div>
          <span className="text-[12px] text-white/25 tabular-nums">
            {profiles.length}/{MAX_PROFILES}
          </span>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {/* 로딩 */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 spinner-gradient rounded-full animate-spin" />
          </div>
        )}

        {/* 프로필 목록 */}
        {!isLoading && profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => router.push(`/user/${profile.id}`)}
            className="glass rounded-2xl px-4 py-4 w-full text-left card-interactive group relative"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-bold text-white">
                  {profile.name}
                </p>
                <p className="text-[13px] text-white/40 mt-1">
                  {profile.origin.name} → {profile.dest.name}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {profile.id !== 'default' && (
              <span
                onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                role="button"
                aria-label="삭제"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
          </button>
        ))}

        {/* 추가 버튼 / 폼 */}
        {!isLoading && (
          showForm ? (
            <AddProfileForm
              onSuccess={async (profile) => {
                setShowForm(false);
                await loadProfiles();
                router.push(`/user/${profile.id}`);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              disabled={isFull}
              className="glass rounded-2xl px-4 py-4 w-full text-center text-white/40 hover:text-white/70 transition-colors border border-dashed border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="text-lg mr-2">+</span>
              <span className="text-sm">
                {isFull ? `최대 ${MAX_PROFILES}개 도달` : '새 경로 추가'}
              </span>
            </button>
          )
        )}
      </div>
    </main>
  );
}

function AddProfileForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (profile: UserProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [dest, setDest] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim() && origin && dest;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !origin || !dest) return;

    // 프론트 검증
    if (origin.name === dest.name) {
      setError('출발역과 도착역이 같습니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { profile, error: apiError } = await createProfile({
      name: name.trim(),
      origin,
      dest,
    });

    setIsSubmitting(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (profile) {
      onSuccess(profile);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl px-4 py-4 space-y-4">
      <p className="text-sm font-bold text-white/80">새 경로 추가</p>

      {/* 이름 */}
      <div>
        <label className="text-xs text-white/40 block mb-1">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="예: 철수 출근길"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* 출발지 검색 */}
      <StationSearch
        label="출발지"
        placeholder="역 또는 정류장 이름"
        value={origin}
        onChange={setOrigin}
      />

      {/* 도착지 검색 */}
      <StationSearch
        label="도착지"
        placeholder="역 또는 정류장 이름"
        value={dest}
        onChange={setDest}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-400/20 px-3 py-2">
          <p className="text-[13px] text-red-400/90">{error}</p>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 bg-white/5 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-500/80 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '추가 중...' : '추가'}
        </button>
      </div>
    </form>
  );
}
