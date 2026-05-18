'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getInvoices, deleteInvoice, saveInvoice } from '@/lib/storage';
import { Invoice } from '@/lib/types';
import { formatCurrency, getInvoiceStatusLabel, getInvoiceTypeLabel } from '@/lib/utils';
import { Plus, Search, Trash2, Edit, Eye, MoreHorizontal, ChevronDown, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = () => setInvoices(getInvoices());
  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${inv.series} ${inv.number}`.toLowerCase().includes(q) ||
      inv.buyer?.name?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleDelete = (id: string) => {
    if (confirm('Ar tikrai norite ištrinti šią sąskaitą?')) {
      deleteInvoice(id);
      load();
    }
    setOpenMenu(null);
  };

  const handleMarkPaid = (inv: Invoice) => {
    saveInvoice({ ...inv, status: 'paid', updatedAt: new Date().toISOString() });
    load();
    setOpenMenu(null);
  };

  const totalAll = filtered.reduce((s, i) => s + i.total, 0);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Sąskaitos</h1>
        <Link href="/invoices/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium">
          <Plus size={16} /> Nauja sąskaita
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ieškoti sąskaitos..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white appearance-none focus:border-blue-400"
          >
            <option value="all">Visi statusai</option>
            <option value="draft">Juodraštis</option>
            <option value="unpaid">Neapmokėta</option>
            <option value="paid">Apmokėta</option>
            <option value="overdue">Vėluojanti</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-4">
              {invoices.length === 0 ? 'Dar nėra jokių sąskaitų' : 'Nerasta sąskaitų pagal filtrus'}
            </p>
            {invoices.length === 0 && (
              <Link href="/invoices/create"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
                <Plus size={15} /> Sukurti pirmą sąskaitą
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Numeris</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Pirkėjas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Apmokėti iki</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Suma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statusas</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`}
                        className="font-medium text-blue-600 hover:underline">
                        {inv.series} {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{getInvoiceTypeLabel(inv.type)}</td>
                    <td className="px-4 py-3 text-gray-700">{inv.buyer?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.dueDate}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${inv.status}`}>
                        {getInvoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenu === inv.id && (
                        <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 w-44 dropdown-menu">
                          <Link href={`/invoices/${inv.id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                            onClick={() => setOpenMenu(null)}>
                            <Eye size={14} className="text-gray-400" /> Peržiūrėti
                          </Link>
                          <Link href={`/invoices/${inv.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                            onClick={() => setOpenMenu(null)}>
                            <Edit size={14} className="text-gray-400" /> Redaguoti
                          </Link>
                          {inv.status !== 'paid' && (
                            <button onClick={() => handleMarkPaid(inv)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-green-600">
                              Pažymėti apmokėta
                            </button>
                          )}
                          <hr className="my-1 border-gray-100" />
                          <button onClick={() => handleDelete(inv.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-500 text-left">
                            <Trash2 size={14} /> Ištrinti
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <span className="text-sm text-gray-500">
                Iš viso: <strong className="text-gray-900">{formatCurrency(totalAll)}</strong>
                <span className="ml-2 text-gray-400">({filtered.length} sąsk.)</span>
              </span>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
