'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import StatisticsChart from '@/components/StatisticsChart';
import { getInvoices } from '@/lib/storage';
import { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronDown, ArrowUpRight, Loader2 } from 'lucide-react';

export default function StatisticsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getInvoices().then(data => { setInvoices(data); setLoading(false); });
  }, []);

  const yearInvoices = useMemo(() =>
    invoices.filter(i => i.date?.startsWith(String(year))),
  [invoices, year]);

  const monthData = useMemo(() => {
    const map: Record<number, { issued: number; received: number; expenses: number; netProfit: number }> = {};
    yearInvoices.forEach(inv => {
      const m = new Date(inv.date).getMonth();
      if (!map[m]) map[m] = { issued: 0, received: 0, expenses: 0, netProfit: 0 };
      map[m].issued += inv.total;
      if (inv.status === 'paid') map[m].received += inv.total;
      map[m].netProfit += inv.total;
    });
    return Object.entries(map).map(([month, d]) => ({ month: Number(month), ...d }));
  }, [yearInvoices]);

  const totalIssued = yearInvoices.reduce((s, i) => s + i.total, 0);
  const totalReceived = yearInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalUnpaid = yearInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  return (
    <AppShell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h1 className="text-sm font-medium text-gray-500">Metų statistika</h1>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-900">{year} metai</span>
            <button onClick={() => setYear(y => y + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>Intervalas</span>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Metai <ChevronDown size={13} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>Serija</span>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Visi <ChevronDown size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100">
          <KpiCell label="Išrašytos sąskaitos" value={formatCurrency(totalIssued)} hasDropdown hasArrow />
          <KpiCell label="Gauti mokėjimai" value={formatCurrency(totalReceived)} />
          <KpiCell label="Neapmokėtos sąskaitos" value={formatCurrency(totalUnpaid)} hasDropdown hasArrow />
          <KpiCell label="Sąnaudos" value={formatCurrency(0)} hasDropdown />
          <KpiCell label="Grynasis pelnas" value={formatCurrency(totalIssued)} />
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            </div>
          ) : (
            <StatisticsChart data={monthData} year={year} />
          )}
        </div>

        <div className="flex items-center gap-2 px-6 pb-4 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          <span>Ką reiškia šie duomenys?</span>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCell({ label, value, hasDropdown, hasArrow }: {
  label: string; value: string; hasDropdown?: boolean; hasArrow?: boolean;
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {hasDropdown && <ChevronDown size={13} className="text-gray-400" />}
        {hasArrow && <ArrowUpRight size={13} className="text-gray-400" />}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
