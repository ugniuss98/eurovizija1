import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Try rekvizitai.lt public API
    const url = `https://rekvizitai.vz.lt/api/?method=getUnitList&name=${encodeURIComponent(query)}&page=1&pageResults=10&lang=LT`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.unitList)) {
        const results = data.unitList.map((c: Record<string, string>) => ({
          title: c.title || c.name || '',
          code: c.code || '',
          vatCode: c.vatCode || c.vat || '',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
        }));
        return NextResponse.json(results);
      }
    }
  } catch {
    // fall through to empty
  }

  return NextResponse.json([]);
}
