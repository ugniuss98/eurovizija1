import { Invoice, Settings } from './types';

const INVOICES_KEY = 'saskaitos_invoices';
const SETTINGS_KEY = 'saskaitos_settings';

const defaultSettings: Settings = {
  company: {
    name: 'Mano Įmonė',
    address: 'Gedimino pr. 1, LT-01001 Vilnius',
    companyCode: '123456789',
    vatCode: 'LT123456789',
    phone: '+370 600 00000',
    email: 'info@manoįmonė.lt',
    bankAccounts: [
      { id: '1', bankName: 'Swedbank', iban: 'LT000000000000000000', enabled: true },
    ],
  },
  defaultSeries: 'BA',
  defaultPaymentDays: 30,
  defaultVatRate: 21,
  currency: 'EUR',
  issuedBy: 'Vardas Pavardenis',
};

export function getSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(INVOICES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getInvoices();
  const idx = invoices.findIndex(i => i.id === invoice.id);
  if (idx >= 0) {
    invoices[idx] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter(i => i.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getNextNumber(series: string): number {
  const invoices = getInvoices();
  const seriesInvoices = invoices.filter(i => i.series === series);
  if (seriesInvoices.length === 0) return 1;
  return Math.max(...seriesInvoices.map(i => i.number)) + 1;
}
