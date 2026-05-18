import { NextRequest, NextResponse } from 'next/server';

interface CompanyResult {
  title: string;
  code: string;
  vatCode: string;
  address: string;
  phone: string;
  email: string;
}

// Registrų centras JAR (Juridinių asmenų registras) REST API
async function searchRC(query: string): Promise<CompanyResult[]> {
  const isCode = /^\d{7,9}$/.test(query.trim());
  const param = isCode
    ? `kodas=${encodeURIComponent(query.trim())}`
    : `pavadinimas=${encodeURIComponent(query.trim())}`;

  const res = await fetch(
    `https://www.registrucentras.lt/jar/p/rest.php?${param}&pageSize=10`,
    {
      headers: {
        'Accept': 'application/json, text/xml, */*',
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!res.ok) return [];

  const text = await res.text();

  // Try JSON parse
  try {
    const json = JSON.parse(text);
    const items: Record<string, string>[] = Array.isArray(json)
      ? json
      : json.items ?? json.result ?? json.data ?? [];
    return items.map(c => ({
      title: c.JA_PAVADINIMAS ?? c.ja_pavadinimas ?? c.pavadinimas ?? c.name ?? '',
      code: c.JA_KODAS ?? c.ja_kodas ?? c.kodas ?? c.code ?? '',
      vatCode: c.PVM_MOKĖTOJO_KODAS ?? c.pvm_kodas ?? c.pvm ?? '',
      address: c.JA_ADR ?? c.ja_adresas ?? c.adresas ?? c.address ?? '',
      phone: c.TELEFONAS ?? c.telefonas ?? c.phone ?? '',
      email: c.EL_PASTAS ?? c.el_pastas ?? c.email ?? '',
    })).filter(c => c.title || c.code);
  } catch { /* try XML */ }

  // Parse XML
  const items: CompanyResult[] = [];
  const itemBlocks = text.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };
    const title = get('JA_PAVADINIMAS') || get('PAVADINIMAS') || get('name');
    const code = get('JA_KODAS') || get('KODAS') || get('code');
    if (title || code) {
      items.push({
        title,
        code,
        vatCode: get('PVM_KODAS') || get('PVM_MOKĖTOJO_KODAS') || '',
        address: get('JA_ADR') || get('ADRESAS') || '',
        phone: get('TELEFONAS') || '',
        email: get('EL_PASTAS') || '',
      });
    }
  }
  return items;
}

// Rekvizitai.vz.lt fallback
async function searchRekvizitai(query: string): Promise<CompanyResult[]> {
  const res = await fetch(
    `https://rekvizitai.vz.lt/api/?method=getUnitList&name=${encodeURIComponent(query)}&page=1&pageResults=10&lang=LT`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://rekvizitai.vz.lt/',
      },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== 'OK' || !Array.isArray(data.unitList)) return [];
  return data.unitList.map((c: Record<string, string>) => ({
    title: c.title || c.name || '',
    code: c.code || '',
    vatCode: c.vatCode || c.vat || '',
    address: c.address || '',
    phone: c.phone || '',
    email: c.email || '',
  }));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.length < 2) return NextResponse.json([]);

  // Try RC first, then rekvizitai as fallback
  try {
    const results = await searchRC(query);
    if (results.length > 0) return NextResponse.json(results);
  } catch { /* continue to fallback */ }

  try {
    const results = await searchRekvizitai(query);
    if (results.length > 0) return NextResponse.json(results);
  } catch { /* continue to empty */ }

  return NextResponse.json([]);
}
