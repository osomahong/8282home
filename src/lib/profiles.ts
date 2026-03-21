import type { UserProfile } from '@/types/route';

export async function fetchProfiles(): Promise<UserProfile[]> {
  const res = await fetch('/api/profiles');
  if (!res.ok) return [];
  const data = await res.json();
  return data.profiles ?? [];
}

export async function fetchProfile(id: string): Promise<UserProfile | undefined> {
  const profiles = await fetchProfiles();
  return profiles.find((p) => p.id === id);
}

export async function createProfile(
  profile: Omit<UserProfile, 'id' | 'createdAt'>,
): Promise<{ profile?: UserProfile; error?: string }> {
  const res = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? '추가에 실패했습니다.' };
  return { profile: data.profile };
}

export async function removeProfile(id: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/profiles?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    return { error: data.error ?? '삭제에 실패했습니다.' };
  }
  return {};
}
