'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getSettings, saveSettings } from '@/lib/storage';
import { Settings, BankAccount } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return <AppShell><div className="p-8 text-center text-gray-400">Kraunama...</div></AppShell>;

  const update = (path: string, value: unknown) => {
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
        bankAccounts: prev.company.bankAccounts.map(a => a.id === id ? { ...a, [field]: val } : a)
      }
    } : prev);
  };

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Nustatymai</h1>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
            <Save size={15} /> {saved ? 'Išsaugota!' : 'Išsaugoti'}
          </button>
        </div>

        <div className="space-y-5">
          <Section title="Veiklos informacija">
            <Field label="Įmonės pavadinimas">
              <input value={settings.company.name} onChange={e => update('company.name', e.target.value)}
                className="input" />
            </Field>
            <Field label="Adresas">
              <input value={settings.company.address} onChange={e => update('company.address', e.target.value)}
                className="input" />
            </Field>
            <Field label="Įmonės kodas">
              <input value={settings.company.companyCode} onChange={e => update('company.companyCode', e.target.value)}
                className="input" />
            </Field>
            <Field label="PVM kodas">
              <input value={settings.company.vatCode ?? ''} onChange={e => update('company.vatCode', e.target.value)}
                placeholder="Neprivaloma"
                className="input" />
            </Field>
            <Field label="Telefonas">
              <input value={settings.company.phone ?? ''} onChange={e => update('company.phone', e.target.value)}
                className="input" />
            </Field>
            <Field label="El. paštas">
              <input value={settings.company.email ?? ''} onChange={e => update('company.email', e.target.value)}
                className="input" />
            </Field>
          </Section>

          <Section title="Banko sąskaitos">
            <div className="space-y-2">
              {settings.company.bankAccounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-2">
                  <input value={acc.bankName} onChange={e => updateBank(acc.id, 'bankName', e.target.value)}
                    placeholder="Banko pavadinimas"
                    className="input flex-1" />
                  <input value={acc.iban} onChange={e => updateBank(acc.id, 'iban', e.target.value)}
                    placeholder="IBAN"
                    className="input flex-1 font-mono text-xs" />
                  <button onClick={() => removeBank(acc.id)}
                    className="text-red-300 hover:text-red-500 p-1.5">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addBank}
                className="flex items-center gap-1.5 text-blue-600 text-sm hover:text-blue-700 mt-1">
                <Plus size={14} /> Pridėti banko sąskaitą
              </button>
            </div>
          </Section>

          <Section title="Sąskaitų nustatymai">
            <Field label="Numatytoji serija">
              <input value={settings.defaultSeries} onChange={e => update('defaultSeries', e.target.value)}
                className="input w-24" />
            </Field>
            <Field label="Apmokėjimo terminas (d.)">
              <input type="number" value={settings.defaultPaymentDays}
                onChange={e => update('defaultPaymentDays', Number(e.target.value))}
                className="input w-24" />
            </Field>
            <Field label="Numatytasis PVM (%)">
              <input type="number" value={settings.defaultVatRate}
                onChange={e => update('defaultVatRate', Number(e.target.value))}
                className="input w-24" />
            </Field>
            <Field label="Valiuta">
              <select value={settings.currency} onChange={e => update('currency', e.target.value)}
                className="input w-28">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </Field>
            <Field label="Sąskaitą išrašo">
              <input value={settings.issuedBy} onChange={e => update('issuedBy', e.target.value)}
                className="input" />
            </Field>
          </Section>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
      `}</style>
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
