import https from 'node:https';
import type { OdsaySearchResponse, OdsayPath, RouteOption, RouteSegment, TransportType } from '@/types/route';

const ODSAY_BASE_URL = 'https://api.odsay.com/v1/api';

/**
 * Node.js https 모듈로 GET 요청. Referer 헤더를 확실히 전송합니다.
 * (Node.js fetch는 Referer를 forbidden header로 제거할 수 있음)
 */
export function odsayGet(url: string): Promise<unknown> {
  const siteUrl = (process.env.SITE_URL ?? 'http://localhost:3000').trim().replace(/[\r\n]/g, '');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Referer: siteUrl } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(`ODsay JSON parse error: ${body.slice(0, 200)}`)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * ODsay 경로탐색 API를 서버사이드에서 호출합니다.
 */
export async function searchRoutes(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Promise<OdsaySearchResponse> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) throw new Error('ODSAY_API_KEY가 설정되지 않았습니다.');

  const params = new URLSearchParams({
    SX: String(startX),
    SY: String(startY),
    EX: String(endX),
    EY: String(endY),
    apiKey,
    OPT: '0',
    SearchType: '0',
    SearchPathType: '0',
  });

  const data = await odsayGet(`${ODSAY_BASE_URL}/searchPubTransPathT?${params}`) as Record<string, unknown>;

  if (data.error) {
    throw new Error(`ODsay error: ${JSON.stringify(data.error)}`);
  }

  return data as unknown as OdsaySearchResponse;
}

/**
 * ODsay 경로 응답을 앱 내부 RouteOption 형태로 변환합니다.
 * 도보 구간도 포함하여 타임라인 바에 활용합니다.
 */
export function normalizeOdsayPaths(paths: OdsayPath[]): RouteOption[] {
  return paths.map((path, idx) => {
    const segments = path.subPath.map((sp, segIdx): RouteSegment => {
      const type: TransportType =
        sp.trafficType === 1 ? 'subway' : sp.trafficType === 2 ? 'bus' : 'walk';
      const lane = sp.lane?.[0];

      let lineName = '';
      if (type === 'subway') {
        lineName = lane?.name ?? '지하철';
      } else if (type === 'bus') {
        lineName = lane?.busNo ?? lane?.name ?? '버스';
      } else {
        lineName = '도보';
      }

      return {
        index: segIdx,
        type,
        lineName,
        startName: sp.startName ?? '',
        endName: sp.endName ?? '',
        startStationId: String(sp.startID ?? sp.startLocalStationID ?? ''),
        ridingTime: sp.sectionTime,
        headway: 0,
        distance: sp.distance,
        regionType:
          type === 'bus' && lane?.busCityCode === 1000
            ? 'seoul'
            : type === 'bus'
              ? 'gyeonggi'
              : undefined,
      };
    });

    const transitSegments = segments.filter((s) => s.type !== 'walk');

    const pathTypeLabel =
      path.pathType === 1
        ? '지하철'
        : path.pathType === 2
          ? '버스'
          : '버스+지하철';

    const name =
      transitSegments.map((s) => s.lineName).join(' → ') || pathTypeLabel;

    return {
      id: `route_${idx}_${path.pathType}`,
      name,
      baseTotalTime: path.info.totalTime,
      estimatedTotalTime: path.info.totalTime,
      estimatedArrivalAt: new Date(
        Date.now() + path.info.totalTime * 60 * 1000,
      ).toISOString(),
      segments,
      transferCount:
        path.info.busTransitCount + path.info.subwayTransitCount - 1,
      totalFare: path.info.payment,
    };
  });
}
