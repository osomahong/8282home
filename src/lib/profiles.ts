import type { UserProfile } from '@/types/route';

const STORAGE_KEY = 'ddakdochak_profiles';
const MAX_PROFILES = 20;

function readProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export async function fetchProfiles(): Promise<UserProfile[]> {
  return readProfiles();
}

export async function fetchProfile(id: string): Promise<UserProfile | undefined> {
  return readProfiles().find((p) => p.id === id);
}

export async function createProfile(
  profile: Omit<UserProfile, 'id' | 'createdAt'>,
): Promise<{ profile?: UserProfile; error?: string }> {
  const { name, origin, dest } = profile;

  if (!name?.trim()) return { error: '이름을 입력해 주세요.' };
  if (name.trim().length > 20) return { error: '이름은 20자 이내로 입력해 주세요.' };
  if (!origin?.name || !origin?.lat || !origin?.lng) return { error: '출발 역을 선택해 주세요.' };
  if (!dest?.name || !dest?.lat || !dest?.lng) return { error: '도착 역을 선택해 주세요.' };
  if (origin.name === dest.name) return { error: '출발역과 도착역이 같습니다.' };

  const profiles = readProfiles();

  if (profiles.length >= MAX_PROFILES) {
    return { error: `경로는 최대 ${MAX_PROFILES}개까지 추가할 수 있습니다.` };
  }

  const duplicate = profiles.find(
    (p) => p.origin.name === origin.name && p.dest.name === dest.name,
  );
  if (duplicate) {
    return { error: `"${origin.name} → ${dest.name}" 경로가 이미 존재합니다 (${duplicate.name}).` };
  }

  const newProfile: UserProfile = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    origin: { name: origin.name, lat: origin.lat, lng: origin.lng },
    dest: { name: dest.name, lat: dest.lat, lng: dest.lng },
    createdAt: new Date().toISOString(),
  };

  profiles.push(newProfile);
  saveProfiles(profiles);

  return { profile: newProfile };
}

export async function removeProfile(id: string): Promise<{ error?: string }> {
  if (id === 'default') return { error: '기본 경로는 삭제할 수 없습니다.' };

  const profiles = readProfiles();
  const filtered = profiles.filter((p) => p.id !== id);

  if (filtered.length === profiles.length) {
    return { error: '해당 경로를 찾을 수 없습니다.' };
  }

  saveProfiles(filtered);
  return {};
}
