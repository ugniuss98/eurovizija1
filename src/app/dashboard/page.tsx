'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getInvoices } from '@/lib/storage';
import { Invoice } from '@/lib/types';
import { formatCurrency, getInvoiceStatusLabel } from '@/lib/utils';
import { FileText, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const totalIssued = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const unpaid = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const totalUnpaid = unpaid.reduce((s, i) => s + i.total, 0);
  const recent = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Valdymo pultas</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Išrašytos sąskaitos"
          value={formatCurrency(totalIssued)}
          icon={<FileText size={20} className="text-blue-500" />}
          color="blue"
        />
        <StatCard
          label="Gauti mokėjimai"
          value={formatCurrency(totalPaid)}
          icon={<TrendingUp size={20} className="text-green-500" />}
          color="green"
        />
        <StatCard
          label="Neapmokėtos sąskaitos"
          value={formatCurrency(totalUnpaid)}
          icon={<Clock size={20} className="text-orange-500" />}
          color="orange"
          count={unpaid.length}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Paskutinės sąskaitos</h2>
          <Link href="/invoices" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Visos sąskaitos <ArrowUpRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Dar nėra sąskaitų</p>
            <Link href="/invoices/create"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
              Sukurti pirmą sąskaitą
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Sąskaita</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Pirkėjas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Suma</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statusas</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(inv => (
                <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-blue-600 hover:underline">
                      {inv.series} {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.buyer?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${inv.status}`}>
                      {getInvoiceStatusLabel(inv.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, color, count }: {
  label: string; value: string; icon: React.ReactNode; color: string; count?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-50`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="ml-auto text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
