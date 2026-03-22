import { NextResponse } from 'next/server';
import { request } from 'undici';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ODSAY_API_KEY ?? '';
  const siteUrl = (process.env.SITE_URL ?? '').trim();

  const diagnostics: Record<string, unknown> = {
    apiKeyFirst5: apiKey.slice(0, 5),
    apiKeyLength: apiKey.length,
    apiKeyHex: Buffer.from(apiKey).toString('hex'),
    siteUrl,
    siteUrlHex: Buffer.from(siteUrl).toString('hex'),
    nodeVersion: process.version,
  };

  try {
    const url = `https://api.odsay.com/v1/api/searchStation?lang=0&stationName=${encodeURIComponent('강남')}&stationClass=2&apiKey=${encodeURIComponent(apiKey)}`;

    diagnostics.requestUrl = url;

    const { statusCode, body } = await request(url, {
      method: 'GET',
      headers: { referer: siteUrl },
    });
    const data = await body.json();
    diagnostics.statusCode = statusCode;
    diagnostics.odsayResponse = data;
  } catch (e) {
    diagnostics.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(diagnostics);
}
