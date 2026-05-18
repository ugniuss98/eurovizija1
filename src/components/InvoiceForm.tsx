'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, Lock, X, Eye, EyeOff, Plus, Trash2,
  Minus, Edit2, CheckCircle2
} from 'lucide-react';
import { Invoice, InvoiceItem, Settings, Client, BankAccount } from '@/lib/types';
import {
  generateId, today, addDays, calcItemTotal, calcInvoiceTotals,
  getInvoiceTypeLabel
} from '@/lib/utils';
import { saveInvoice, getSettings, getNextNumber } from '@/lib/storage';
import CompanySearch from './CompanySearch';

const UNITS = ['vnt', 'val', 'kg', 'l', 'm', 'm²', 'm³', 'kompl', 'proc'];

interface Props {
  initial?: Invoice;
  defaultType?: Invoice['type'];
}

function newItem(): InvoiceItem {
  return { id: generateId(), name: '', description: '', unit: 'vnt', quantity: 1, price: 0, discount: 0, total: 0 };
}

export default function InvoiceForm({ initial, defaultType = 'invoice' }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);

  const [type, setType] = useState<Invoice['type']>(initial?.type ?? defaultType);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [series, setSeries] = useState(initial?.series ?? 'BA');
  const [number, setNumber] = useState(initial?.number ?? 1);
  const [locked, setLocked] = useState(true);
  const [date, setDate] = useState(initial?.date ?? today());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? addDays(today(), 30));
  const [buyer, setBuyer] = useState<Client | null>(initial?.buyer ?? null);
  const [items, setItems] = useState<InvoiceItem[]>(initial?.items ?? [newItem()]);
  const [totalDiscountEnabled, setTotalDiscountEnabled] = useState(initial?.totalDiscountEnabled ?? false);
  const [totalDiscount, setTotalDiscount] = useState(initial?.totalDiscount ?? 0);
  const [vatEnabled, setVatEnabled] = useState(initial?.vatEnabled ?? false);
  const [vatRate, setVatRate] = useState(initial?.vatRate ?? 21);
  const [paidEnabled, setPaidEnabled] = useState(initial?.status === 'paid');
  const [issuedBy, setIssuedBy] = useState(initial?.issuedBy ?? '');
  const [acceptedBy, setAcceptedBy] = useState(initial?.acceptedBy ?? '');
  const [notesEnabled, setNotesEnabled] = useState(!!(initial?.notes));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [commentEnabled, setCommentEnabled] = useState(!!(initial?.comment));
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setIssuedBy(initial?.issuedBy ?? s.issuedBy);
    setBankAccounts(s.company.bankAccounts);
    if (!initial) {
      setSeries(s.defaultSeries);
      setNumber(getNextNumber(s.defaultSeries));
      setDueDate(addDays(today(), s.defaultPaymentDays));
    }
  }, [initial]);

  const updateItem = (id: string, field: keyof InvoiceItem, val: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      updated.total = calcItemTotal(updated);
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, newItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const { subtotal, discountAmount, total } = calcInvoiceTotals(items, totalDiscountEnabled ? totalDiscount : 0);
  const vatAmount = vatEnabled ? total * (vatRate / 100) : 0;
  const grandTotal = total + vatAmount;

  function numberToWords(n: number): string {
    const euros = Math.floor(n);
    const cents = Math.round((n - euros) * 100);
    return `${euros} EUR ${cents.toString().padStart(2, '0')} ct`;
  }

  const handleSave = (status: Invoice['status'] = 'unpaid') => {
    if (!settings) return;
    setSaving(true);
    const invoice: Invoice = {
      id: initial?.id ?? generateId(),
      type,
      series,
      number,
      date,
      dueDate,
      status: paidEnabled ? 'paid' : status,
      seller: settings.company,
      buyer: buyer ?? { id: '', name: '', companyCode: '' },
      items,
      totalDiscount,
      totalDiscountEnabled,
      subtotal,
      vatRate,
      vatEnabled,
      total: grandTotal,
      currency: settings.currency,
      notes: notesEnabled ? notes : undefined,
      comment: commentEnabled ? comment : undefined,
      issuedBy,
      acceptedBy,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInvoice(invoice);
    setSaving(false);
    router.push('/invoices');
  };

  if (!settings) return <div className="p-8 text-center text-gray-400">Kraunama...</div>;

  const seller = settings.company;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top project bar */}
      <div className="flex items-center justify-end mb-2 gap-4 text-sm text-gray-500">
        <span>Projektas</span>
        <button className="text-blue-600 hover:underline font-medium flex items-center gap-1">
          Pasirinkite projektą <ChevronDown size={14} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Title row */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(v => !v)}
              className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {getInvoiceTypeLabel(type).toUpperCase()}
              <ChevronDown size={20} />
            </button>
            {showTypeMenu && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 w-52 dropdown-menu">
                {(['invoice', 'proforma', 'credit'] as const).map(t => (
                  <button key={t} onClick={() => { setType(t); setShowTypeMenu(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50">
                    {getInvoiceTypeLabel(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Series / Number / Date */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 max-w-sm mx-auto mb-8">
          <label className="text-sm text-gray-500 text-right self-center">Serija</label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={series}
                onChange={e => { setSeries(e.target.value); if (!initial) setNumber(getNextNumber(e.target.value)); }}
                className="pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg appearance-none focus:border-blue-400"
              >
                {['BA', 'INV', 'SF', 'PVM'].map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <input
              type="number"
              value={number}
              onChange={e => !locked && setNumber(Number(e.target.value))}
              readOnly={locked}
              className={`w-16 text-center py-1.5 text-sm border rounded-lg ${locked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-blue-400 focus:ring-1 focus:ring-blue-100'}`}
            />
            <button onClick={() => setLocked(v => !v)} title={locked ? 'Atrakinti' : 'Užrakinti'}
              className="text-gray-400 hover:text-gray-600">
              <Lock size={16} className={locked ? 'text-gray-400' : 'text-blue-500'} />
            </button>
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {series} {number}
            </span>
          </div>

          <label className="text-sm text-gray-500 text-right self-center">Sąskaitos data</label>
          <div className="flex items-center gap-1">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-400" />
            <button onClick={() => setDate('')} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
          </div>

          <label className="text-sm text-gray-500 text-right self-center">Apmokėti iki</label>
          <div className="flex items-center gap-1">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-400" />
            <button onClick={() => setDueDate('')} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
            <Eye size={14} className="text-gray-300" />
          </div>
        </div>

        {/* Seller / Buyer */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Seller */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Pardavėjas</h3>
            <p className="font-medium text-gray-900 mb-3">{seller.name}</p>
            <div className="space-y-2 text-sm">
              <SellerRow label="Adresas" value={seller.address} />
              <SellerRow label="Įm. kodas" value={seller.companyCode} />
              {seller.vatCode && <SellerRow label="PVM kodas" value={seller.vatCode} />}
              {seller.phone && <SellerRow label="Telefonas" value={seller.phone} />}
              {seller.email && <SellerRow label="El. paštas" value={seller.email} />}
            </div>

            {/* Bank accounts */}
            <div className="mt-4 border border-gray-200 rounded-xl p-3 space-y-2">
              {bankAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600 font-medium">{acc.bankName}</span>
                  <span className="text-sm text-gray-500 font-mono text-xs">{acc.iban}</span>
                  <Toggle checked={acc.enabled} onChange={v => setBankAccounts(prev =>
                    prev.map(a => a.id === acc.id ? { ...a, enabled: v } : a)
                  )} />
                </div>
              ))}
              <button className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 mt-1">
                <Plus size={14} /> Pridėti naują banko sąskaitą
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Toggle checked={false} onChange={() => {}} />
              <span>Atnaujinti veiklos informaciją nustatymuose</span>
            </div>
          </div>

          {/* Buyer */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Pirkėjas</h3>
            <CompanySearch value={buyer} onChange={setBuyer} />
            {buyer && (
              <div className="mt-3 space-y-2 text-sm bg-blue-50 rounded-xl p-3">
                {buyer.address && <SellerRow label="Adresas" value={buyer.address} />}
                {buyer.companyCode && <SellerRow label="Įm. kodas" value={buyer.companyCode} />}
                {buyer.vatCode && <SellerRow label="PVM kodas" value={buyer.vatCode} />}
                {buyer.phone && <SellerRow label="Telefonas" value={buyer.phone} />}
                {buyer.email && <SellerRow label="El. paštas" value={buyer.email} />}
                <button onClick={() => setBuyer(null)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs mt-1">
                  <X size={12} /> Pašalinti pirkėją
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Prekė/paslauga</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-6">#</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs">Pavadinimas</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-24">Matas</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-28">Kiekis</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-28">Kaina</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-24">Nuolaida (%)</th>
                  <th className="px-2 py-2.5 text-left font-medium text-gray-500 text-xs w-28">Iš viso</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-2 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <input
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Pavadinimas"
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 rounded text-sm focus:bg-white"
                      />
                      <input
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Įveskite aprašymą čia"
                        className="w-full px-2 py-1 text-xs text-gray-400 border border-transparent hover:border-gray-200 focus:border-blue-400 rounded focus:bg-white"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <div className="relative">
                        <select
                          value={item.unit}
                          onChange={e => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full pl-2 pr-6 py-1.5 border border-gray-200 rounded text-sm appearance-none focus:border-blue-400"
                        >
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
                        <button onClick={() => updateItem(item.id, 'quantity', Math.max(0, item.quantity - 1))}
                          className="px-2 py-1.5 text-gray-400 hover:bg-gray-100">
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-12 text-center text-sm py-1.5 focus:outline-none"
                        />
                        <button onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                          className="px-2 py-1.5 text-gray-400 hover:bg-gray-100">
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-blue-400 text-right"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={item.discount}
                        onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:border-blue-400 text-right"
                        min={0} max={100}
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-medium text-gray-700">
                      {calcItemTotal(item).toFixed(2)}
                    </td>
                    <td className="px-1">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)}
                          className="text-red-300 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addItem}
            className="mt-3 flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 font-medium">
            <Plus size={15} /> Pridėti prekę/paslaugą
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Toggle checked={totalDiscountEnabled} onChange={setTotalDiscountEnabled} />
                <span className="text-gray-600">Nuolaida visai sąskaitai</span>
              </div>
              {totalDiscountEnabled && (
                <input type="number" value={totalDiscount} onChange={e => setTotalDiscount(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right border border-gray-200 rounded px-2 py-1 text-sm" min={0} max={100} />
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Toggle checked={vatEnabled} onChange={setVatEnabled} />
                <span className="text-gray-600">PVM</span>
              </div>
              {vatEnabled && (
                <div className="flex items-center gap-1">
                  <input type="number" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-14 text-right border border-gray-200 rounded px-2 py-1 text-sm" />
                  <span className="text-gray-500 text-xs">%</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <div className="flex items-center gap-2">
                <Toggle checked={false} onChange={() => {}} />
                <span className="text-gray-600">Papildoma valiuta</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 mt-2">
              {totalDiscountEnabled && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Nuolaida ({totalDiscount}%)</span>
                  <span>-{discountAmount.toFixed(2)} €</span>
                </div>
              )}
              {vatEnabled && (
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>PVM ({vatRate}%)</span>
                  <span>{vatAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Bendra suma</span>
                <span>{grandTotal.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <div className="flex items-center gap-2">
                <Toggle checked={paidEnabled} onChange={setPaidEnabled} />
                <span className="text-gray-600">Sąskaita apmokėta</span>
              </div>
              {paidEnabled && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 size={13} /> Apmokėta
                </span>
              )}
            </div>
          </div>
        </div>

        {/* In words */}
        <div className="mb-6 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Viso žodžiais: </span>
          {numberToWords(grandTotal)}
        </div>

        {/* Additional info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Papildoma informacija</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sąskaitą išrašė</label>
                <input value={issuedBy} onChange={e => setIssuedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sąskaitą priėmė</label>
                <input value={acceptedBy} onChange={e => setAcceptedBy(e.target.value)}
                  placeholder="Neprivaloma"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400" />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Toggle checked={notesEnabled} onChange={setNotesEnabled} />
                <span className="text-sm text-gray-600">Pridėti pastabą</span>
                <Eye size={14} className="text-gray-400" />
              </div>
              {notesEnabled && (
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Pastaba (matoma sąskaitoje)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 resize-none" />
              )}

              <div className="flex items-center gap-2">
                <Toggle checked={commentEnabled} onChange={setCommentEnabled} />
                <span className="text-sm text-gray-600">Pridėti komentarą</span>
                <EyeOff size={14} className="text-gray-400" />
              </div>
              {commentEnabled && (
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Komentaras (nematomas sąskaitoje)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 resize-none" />
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Priedai <span className="text-xs font-normal text-gray-400">maksimalus failo dydis 10 MB</span>
            </h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer">
              <div className="text-gray-300 mb-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
                  <rect x="8" y="4" width="26" height="34" rx="3" fill="#e5e7eb"/>
                  <path d="M34 4L42 12" stroke="#9ca3af" strokeWidth="2"/>
                  <rect x="32" y="4" width="10" height="10" rx="1" fill="#d1d5db"/>
                  <circle cx="36" cy="38" r="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
                  <path d="M36 34v8M32 38h8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">Įkelkite dokumentą čia</p>
              <p className="text-xs text-gray-400 mt-1">arba spustelėkite ir pasirinkite</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button onClick={() => router.push('/invoices')}
            className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50">
            Atšaukti
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-5 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
            >
              Išsaugoti juodraštį
            </button>
            <button
              onClick={() => handleSave('unpaid')}
              disabled={saving}
              className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              {saving ? 'Saugoma...' : 'Išrašyti sąskaitą'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-700 flex items-center gap-1">
        {value}
        <button className="text-gray-300 hover:text-blue-500 ml-1"><Edit2 size={11} /></button>
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4.5' : 'translate-x-0.5'
      }`} />
    </button>
  );
}
