'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getSettings, saveSettings } from '@/lib/storage';
import { Settings, BankAccount } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) return (
    <AppShell>
      <div className="py-20 text-center"><Loader2 size={28} className="text-blue-400 animate-spin mx-auto" /></div>
    </AppShell>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = (path: string, value: any) => {
    setSettings(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const parts = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const addBank = () => {
    const acc: BankAccount = { id: generateId(), bankName: '', iban: '', enabled: true };
    setSettings(prev => prev ? {
      ...prev,
      company: { ...prev.company, bankAccounts: [...prev.company.bankAccounts, acc] }
    } : prev);
  };

  const removeBank = (id: string) => {
    setSettings(prev => prev ? {
      ...prev,
      company: { ...prev.company, bankAccounts: prev.company.bankAccounts.filter(a => a.id !== id) }
    } : prev);
  };

  const updateBank = (id: string, field: keyof BankAccount, val: string | boolean) => {
    setSettings(prev => prev ? {
      ...prev,
      company: {
        ...prev.company,
        bankAccounts: prev.company.bankAccounts.map(a => a.id === id ? { ...a, [field]: val } : a),
      },
    } : prev);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Nustatymai</h1>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? 'Išsaugota!' : 'Išsaugoti'}
          </button>
        </div>

        <div className="space-y-5">
          <Section title="Veiklos informacija">
            <Field label="Įmonės pavadinimas">
              <Input value={settings.company.name} onChange={v => update('company.name', v)} />
            </Field>
            <Field label="Adresas">
              <Input value={settings.company.address} onChange={v => update('company.address', v)} />
            </Field>
            <Field label="Įmonės kodas">
              <Input value={settings.company.companyCode} onChange={v => update('company.companyCode', v)} />
            </Field>
            <Field label="PVM kodas">
              <Input value={settings.company.vatCode ?? ''} onChange={v => update('company.vatCode', v)} placeholder="Neprivaloma" />
            </Field>
            <Field label="Telefonas">
              <Input value={settings.company.phone ?? ''} onChange={v => update('company.phone', v)} />
            </Field>
            <Field label="El. paštas">
              <Input value={settings.company.email ?? ''} onChange={v => update('company.email', v)} />
            </Field>
          </Section>

          <Section title="Banko sąskaitos">
            <div className="space-y-2">
              {settings.company.bankAccounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-2">
                  <Input value={acc.bankName} onChange={v => updateBank(acc.id, 'bankName', v)} placeholder="Banko pavadinimas" />
                  <Input value={acc.iban} onChange={v => updateBank(acc.id, 'iban', v)} placeholder="IBAN" mono />
                  <button onClick={() => removeBank(acc.id)} className="text-red-300 hover:text-red-500 p-1.5 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addBank} className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 mt-1">
                <Plus size={14} /> Pridėti banko sąskaitą
              </button>
            </div>
          </Section>

          <Section title="Sąskaitų nustatymai">
            <Field label="Numatytoji serija">
              <Input value={settings.defaultSeries} onChange={v => update('defaultSeries', v)} className="w-24" />
            </Field>
            <Field label="Apmokėjimo terminas (d.)">
              <input type="number" value={settings.defaultPaymentDays}
                onChange={e => update('defaultPaymentDays', Number(e.target.value))}
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400" />
            </Field>
            <Field label="Numatytasis PVM (%)">
              <input type="number" value={settings.defaultVatRate}
                onChange={e => update('defaultVatRate', Number(e.target.value))}
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400" />
            </Field>
            <Field label="Valiuta">
              <select value={settings.currency} onChange={e => update('currency', e.target.value)}
                className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </Field>
            <Field label="Sąskaitą išrašo">
              <Input value={settings.issuedBy} onChange={v => update('issuedBy', v)} />
            </Field>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm text-gray-500 w-44 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, className, mono }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 ${mono ? 'font-mono text-xs' : ''} ${className ?? ''}`}
    />
  );
}
