import { NextRequest, NextResponse } from 'next/server';

interface CompanyResult {
  title: string;
  code: string;
  vatCode: string;
  address: string;
  phone: string;
  email: string;
}

async function searchRC(query: string): Promise<CompanyResult[]> {
  const isCode = /^\d{7,9}$/.test(query.trim());
  const param = isCode
    ? `kodas=${encodeURIComponent(query.trim())}`
    : `pavadinimas=${encodeURIComponent(query.trim())}`;

  const url = `https://www.registrucentras.lt/jar/p/rest.php?${param}&pageSize=10`;
  console.log('[RC] fetching:', url);

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (compatible)',
    },
    signal: AbortSignal.timeout(6000),
  });

  console.log('[RC] status:', res.status, 'content-type:', res.headers.get('content-type'));
  if (!res.ok) return [];

  const text = await res.text();
  console.log('[RC] response preview:', text.slice(0, 300));

  // JSON parse attempt
  try {
    const json = JSON.parse(text);
    const arr = Array.isArray(json) ? json : json.items ?? json.result ?? json.data ?? [];
    return arr.map((c: Record<string, string>) => ({
      title: c.JA_PAVADINIMAS ?? c.ja_pavadinimas ?? c.pavadinimas ?? '',
      code:  c.JA_KODAS ?? c.ja_kodas ?? c.kodas ?? '',
      vatCode: c.PVM_MOKETOJO_KODAS ?? c.pvm_kodas ?? c.pvmKodas ?? '',
      address: c.JA_ADR ?? c.ja_adresas ?? c.adresas ?? '',
      phone: c.TELEFONAS ?? c.telefonas ?? '',
      email: c.EL_PASTAS ?? c.el_pastas ?? '',
    })).filter((c: CompanyResult) => c.title || c.code);
  } catch { /* try XML */ }

  // XML parse
  const items: CompanyResult[] = [];
  const blocks = text.match(/<(?:item|row|record)[^>]*>([\s\S]*?)<\/(?:item|row|record)>/gi) ?? [];
  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };
    const title = get('JA_PAVADINIMAS') || get('PAVADINIMAS');
    const code  = get('JA_KODAS') || get('KODAS');
    if (title || code) {
      items.push({ title, code, vatCode: get('PVM_KODAS') || get('PVM_MOKETOJO_KODAS'), address: get('JA_ADR') || get('ADRESAS'), phone: get('TELEFONAS'), email: get('EL_PASTAS') });
    }
  }
  console.log('[RC] parsed items:', items.length);
  return items;
}

async function searchRekvizitai(query: string): Promise<CompanyResult[]> {
  const url = `https://rekvizitai.vz.lt/api/?method=getUnitList&name=${encodeURIComponent(query)}&page=1&pageResults=10&lang=LT`;
  console.log('[Rekvizitai] fetching:', url);

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible)',
      'Referer': 'https://rekvizitai.vz.lt/',
    },
    signal: AbortSignal.timeout(6000),
  });

  console.log('[Rekvizitai] status:', res.status);
  if (!res.ok) return [];

  const text = await res.text();
  console.log('[Rekvizitai] preview:', text.slice(0, 300));

  const data = JSON.parse(text);
  if (data.status !== 'OK' || !Array.isArray(data.unitList)) {
    console.log('[Rekvizitai] unexpected shape, status:', data.status);
    return [];
  }
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
  const query = req.nextUrl.searchParams.get('q') ?? '';
  if (query.length < 2) return NextResponse.json([]);

  try {
    const rc = await searchRC(query);
    if (rc.length > 0) return NextResponse.json(rc);
  } catch (e) {
    console.error('[RC] error:', e instanceof Error ? e.message : e);
  }

  try {
    const rv = await searchRekvizitai(query);
    if (rv.length > 0) return NextResponse.json(rv);
  } catch (e) {
    console.error('[Rekvizitai] error:', e instanceof Error ? e.message : e);
  }

  return NextResponse.json([]);
}
