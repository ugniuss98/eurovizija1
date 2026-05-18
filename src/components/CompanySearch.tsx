'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Loader2, Building2 } from 'lucide-react';
import { Client, RekvizitaiCompany } from '@/lib/types';

interface Props {
  value: Client | null;
  onChange: (client: Client | null) => void;
}

export default function CompanySearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RekvizitaiCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/company-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
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

  const handleSelect = (company: RekvizitaiCompany) => {
    onChange({
      id: company.code || Math.random().toString(36).slice(2),
      name: company.title,
      address: company.address,
      companyCode: company.code,
      vatCode: company.vatCode,
      phone: company.phone,
      email: company.email,
    });
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
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
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
              {loading && (
                <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                >
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
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      id: Math.random().toString(36).slice(2),
                      name: query,
                      companyCode: '',
                    });
                    setOpen(false);
                    setQuery('');
                  }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Pridėti &quot;{query}&quot; kaip naują pirkėją
                </button>
              </div>
            ) : query.length < 2 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Įveskite bent 2 simbolius paieškai
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
