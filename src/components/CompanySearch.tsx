'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Loader2, Building2 } from 'lucide-react';
import { Client } from '@/lib/types';

interface RawCompany {
  title?: string; name?: string;
  code?: string;
  vatCode?: string; vat?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface CompanyResult {
  title: string;
  code: string;
  vatCode: string;
  address: string;
  phone: string;
  email: string;
}

interface Props {
  value: Client | null;
  onChange: (client: Client | null) => void;
}

// Called directly from the browser — avoids Vercel server network restrictions
async function fetchCompanies(q: string): Promise<CompanyResult[]> {
  const isCode = /^\d{7,9}$/.test(q.trim());

  // 1. Try rekvizitai.vz.lt (CORS-enabled developer API)
  try {
    const res = await fetch(
      `https://rekvizitai.vz.lt/api/?method=getUnitList&name=${encodeURIComponent(q)}&page=1&pageResults=10&lang=LT`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.unitList) && data.unitList.length > 0) {
        return data.unitList.map((c: RawCompany) => ({
          title: c.title || c.name || '',
          code: c.code || '',
          vatCode: c.vatCode || c.vat || '',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
        }));
      }
    }
  } catch { /* try next */ }

  // 2. Try Registrų centras JAR API
  try {
    const param = isCode
      ? `kodas=${encodeURIComponent(q.trim())}`
      : `pavadinimas=${encodeURIComponent(q.trim())}`;
    const res = await fetch(
      `https://www.registrucentras.lt/jar/p/rest.php?${param}&pageSize=10`,
      { headers: { Accept: 'application/json, */*' }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const text = await res.text();
      // JSON
      try {
        const json = JSON.parse(text);
        const arr: RawCompany[] = Array.isArray(json) ? json : json.items ?? json.result ?? [];
        if (arr.length > 0) return arr.map(c => ({
          title: (c as Record<string,string>).JA_PAVADINIMAS || c.name || '',
          code:  (c as Record<string,string>).JA_KODAS || c.code || '',
          vatCode: (c as Record<string,string>).PVM_MOKETOJO_KODAS || c.vatCode || '',
          address: (c as Record<string,string>).JA_ADR || c.address || '',
          phone: (c as Record<string,string>).TELEFONAS || c.phone || '',
          email: (c as Record<string,string>).EL_PASTAS || c.email || '',
        }));
      } catch { /* XML */ }
      // XML
      const blocks = text.match(/<(?:item|row)[^>]*>([\s\S]*?)<\/(?:item|row)>/gi) ?? [];
      if (blocks.length > 0) {
        return blocks.map(block => {
          const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')); return m ? m[1].trim() : ''; };
          return { title: get('JA_PAVADINIMAS'), code: get('JA_KODAS'), vatCode: get('PVM_MOKETOJO_KODAS'), address: get('JA_ADR'), phone: get('TELEFONAS'), email: get('EL_PASTAS') };
        }).filter(c => c.title || c.code);
      }
    }
  } catch { /* try server proxy */ }

  // 3. Fall back to server-side proxy
  try {
    const res = await fetch(`/api/company-search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return await res.json();
  } catch { /* give up */ }

  return [];
}

export default function CompanySearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await fetchCompanies(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  const handleSelect = (c: CompanyResult) => {
    onChange({
      id: crypto.randomUUID(),
      name: c.title,
      address: c.address,
      companyCode: c.code,
      vatCode: c.vatCode,
      phone: c.phone,
      email: c.email,
    });
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {value ? value.name : 'Pasirinkite pirkėją arba įveskite naują'}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 dropdown-menu overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Ieškoti pagal pavadinimą ar kodą..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
              />
              {loading && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((c, i) => (
                <button key={i} type="button" onClick={() => handleSelect(c)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors">
                  <Building2 size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Įm. k.: {c.code}
                      {c.vatCode && ` · PVM: ${c.vatCode}`}
                      {c.address && ` · ${c.address}`}
                    </div>
                  </div>
                </button>
              ))
            ) : query.length >= 2 && !loading ? (
              <div className="px-4 py-8 text-center">
                <Building2 size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Įmonių nerasta</p>
                <button type="button"
                  onClick={() => { onChange({ id: crypto.randomUUID(), name: query, companyCode: '' }); setOpen(false); setQuery(''); }}
                  className="mt-2 text-xs text-blue-600 hover:underline">
                  Pridėti &quot;{query}&quot; kaip naują pirkėją
                </button>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Įveskite bent 2 simbolius paieškai
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
