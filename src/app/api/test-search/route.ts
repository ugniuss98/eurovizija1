import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test RC
  try {
    const r = await fetch(
      'https://www.registrucentras.lt/jar/p/rest.php?pavadinimas=UAB&pageSize=3',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }, signal: AbortSignal.timeout(6000) }
    );
    const text = await r.text();
    results.rc = { status: r.status, contentType: r.headers.get('content-type'), preview: text.slice(0, 500) };
  } catch (e) { results.rc = { error: String(e) }; }

  // Test rekvizitai
  try {
    const r = await fetch(
      'https://rekvizitai.vz.lt/api/?method=getUnitList&name=UAB&page=1&pageResults=3&lang=LT',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://rekvizitai.vz.lt/' }, signal: AbortSignal.timeout(6000) }
    );
    const text = await r.text();
    results.rekvizitai = { status: r.status, contentType: r.headers.get('content-type'), preview: text.slice(0, 500) };
  } catch (e) { results.rekvizitai = { error: String(e) }; }

  // Test get.rekvizitai
  try {
    const r = await fetch(
      'https://get.rekvizitai.vz.lt/api/company/?search=UAB&lang=lt',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) }
    );
    const text = await r.text();
    results.getRekvizitai = { status: r.status, contentType: r.headers.get('content-type'), preview: text.slice(0, 500) };
  } catch (e) { results.getRekvizitai = { error: String(e) }; }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } });
}
