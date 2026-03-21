import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { UserProfile } from '@/types/route';

const DATA_PATH = path.join(process.cwd(), 'data', 'profiles.json');
const MAX_PROFILES = 20;

async function readProfiles(): Promise<UserProfile[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: UserProfile[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(profiles, null, 2), 'utf-8');
}

export async function GET() {
  const profiles = await readProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, origin, dest } = body;

    // 유효성 검증
    if (!name?.trim()) {
      return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });
    }
    if (name.trim().length > 20) {
      return NextResponse.json({ error: '이름은 20자 이내로 입력해 주세요.' }, { status: 400 });
    }
    if (!origin?.name || !origin?.lat || !origin?.lng) {
      return NextResponse.json({ error: '출발 역을 선택해 주세요.' }, { status: 400 });
    }
    if (!dest?.name || !dest?.lat || !dest?.lng) {
      return NextResponse.json({ error: '도착 역을 선택해 주세요.' }, { status: 400 });
    }
    if (origin.name === dest.name) {
      return NextResponse.json({ error: '출발역과 도착역이 같습니다.' }, { status: 400 });
    }

    const profiles = await readProfiles();

    if (profiles.length >= MAX_PROFILES) {
      return NextResponse.json(
        { error: `경로는 최대 ${MAX_PROFILES}개까지 추가할 수 있습니다.` },
        { status: 400 },
      );
    }

    // 중복 검사 (같은 출발-도착)
    const duplicate = profiles.find(
      (p) => p.origin.name === origin.name && p.dest.name === dest.name,
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `"${origin.name} → ${dest.name}" 경로가 이미 존재합니다 (${duplicate.name}).` },
        { status: 400 },
      );
    }

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      origin: { name: origin.name, lat: origin.lat, lng: origin.lng },
      dest: { name: dest.name, lat: dest.lat, lng: dest.lng },
      createdAt: new Date().toISOString(),
    };

    profiles.push(newProfile);
    await writeProfiles(profiles);

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }
  if (id === 'default') {
    return NextResponse.json({ error: '기본 경로는 삭제할 수 없습니다.' }, { status: 400 });
  }

  const profiles = await readProfiles();
  const filtered = profiles.filter((p) => p.id !== id);

  if (filtered.length === profiles.length) {
    return NextResponse.json({ error: '해당 경로를 찾을 수 없습니다.' }, { status: 404 });
  }

  await writeProfiles(filtered);
  return NextResponse.json({ success: true });
}
