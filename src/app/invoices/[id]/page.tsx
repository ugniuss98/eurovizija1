'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getInvoice, saveInvoice, deleteInvoice } from '@/lib/storage';
import { Invoice } from '@/lib/types';
import { formatCurrency, getInvoiceStatusLabel, getInvoiceTypeLabel } from '@/lib/utils';
import { Edit, Trash2, CheckCircle2, ArrowLeft, Printer, Loader2 } from 'lucide-react';

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    getInvoice(id).then(setInvoice);
  }, [id]);

  if (invoice === undefined) return (
    <AppShell>
      <div className="py-20 text-center"><Loader2 size={28} className="text-blue-400 animate-spin mx-auto" /></div>
    </AppShell>
  );
  if (!invoice) return (
    <AppShell><div className="py-20 text-center text-gray-400">Sąskaita nerasta</div></AppShell>
  );

  const handleMarkPaid = async () => {
    const updated = { ...invoice, status: 'paid' as const, updatedAt: new Date().toISOString() };
    await saveInvoice(updated);
    setInvoice(updated);
  };

  const handleDelete = async () => {
    if (!confirm('Ar tikrai norite ištrinti šią sąskaitą?')) return;
    await deleteInvoice(invoice.id);
    router.push('/invoices');
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
            <h1 className="font-semibold text-gray-900">
              {getInvoiceTypeLabel(invoice.type)} {invoice.series} {invoice.number}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${invoice.status}`}>
              {getInvoiceStatusLabel(invoice.status)}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
              <Printer size={15} /> Spausdinti
            </button>
            {invoice.status !== 'paid' && (
              <button onClick={handleMarkPaid}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700">
                <CheckCircle2 size={15} /> Apmokėta
              </button>
            )}
            <Link href={`/invoices/${invoice.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              <Edit size={15} /> Redaguoti
            </Link>
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-500 rounded-xl hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 print:shadow-none print:border-none">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">{getInvoiceTypeLabel(invoice.type).toUpperCase()}</h2>
            <p className="text-gray-500 mt-1">{invoice.series} {invoice.number}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-1">Sąskaitos data</div>
              <div className="font-medium">{invoice.date}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Apmokėti iki</div>
              <div className="font-medium">{invoice.dueDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Pardavėjas</h3>
              <p className="font-medium">{invoice.seller.name}</p>
              <p className="text-sm text-gray-500 mt-1">{invoice.seller.address}</p>
              <p className="text-sm text-gray-500">Įm. k.: {invoice.seller.companyCode}</p>
              {invoice.seller.vatCode && <p className="text-sm text-gray-500">PVM: {invoice.seller.vatCode}</p>}
              {invoice.seller.phone && <p className="text-sm text-gray-500">{invoice.seller.phone}</p>}
              {invoice.seller.email && <p className="text-sm text-gray-500">{invoice.seller.email}</p>}
              {invoice.seller.bankAccounts?.filter((b: {enabled: boolean}) => b.enabled).map((b: {id: string; bankName: string; iban: string}) => (
                <p key={b.id} className="text-sm text-gray-500 mt-1">{b.bankName}: <span className="font-mono text-xs">{b.iban}</span></p>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Pirkėjas</h3>
              <p className="font-medium">{invoice.buyer?.name || '—'}</p>
              {invoice.buyer?.address && <p className="text-sm text-gray-500 mt-1">{invoice.buyer.address}</p>}
              {invoice.buyer?.companyCode && <p className="text-sm text-gray-500">Įm. k.: {invoice.buyer.companyCode}</p>}
              {invoice.buyer?.vatCode && <p className="text-sm text-gray-500">PVM: {invoice.buyer.vatCode}</p>}
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Pavadinimas</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Matas</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Kiekis</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Kaina</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Nuolaida</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Iš viso</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{item.name || '—'}</span>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{item.unit}</td>
                  <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right">{item.price.toFixed(2)} €</td>
                  <td className="px-3 py-2.5 text-right">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{item.total.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              {invoice.vatEnabled && (
                <>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Be PVM</span>
                    <span>{(invoice.total / (1 + invoice.vatRate / 100)).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>PVM ({invoice.vatRate}%)</span>
                    <span>{(invoice.total - invoice.total / (1 + invoice.vatRate / 100)).toFixed(2)} €</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-200 pt-2 mt-1">
                <span>Iš viso</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Pastaba</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {invoice.issuedBy && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-12 text-sm text-gray-500">
              <div>
                <p className="text-xs text-gray-400 mb-1">Sąskaitą išrašė</p>
                <p className="font-medium text-gray-700">{invoice.issuedBy}</p>
              </div>
              {invoice.acceptedBy && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sąskaitą priėmė</p>
                  <p className="font-medium text-gray-700">{invoice.acceptedBy}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
