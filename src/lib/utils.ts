import { Invoice, InvoiceItem } from './types';

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function calcItemTotal(item: InvoiceItem): number {
  const base = item.quantity * item.price;
  return base - base * (item.discount / 100);
}

export function calcInvoiceTotals(items: InvoiceItem[], totalDiscount = 0): {
  subtotal: number;
  discountAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  const discountAmount = subtotal * (totalDiscount / 100);
  return { subtotal, discountAmount, total: subtotal - discountAmount };
}

export function getInvoiceStatusLabel(status: Invoice['status']): string {
  switch (status) {
    case 'draft': return 'Juodraštis';
    case 'unpaid': return 'Neapmokėta';
    case 'paid': return 'Apmokėta';
    case 'overdue': return 'Vėluojanti';
  }
}

export function getInvoiceTypeLabel(type: Invoice['type']): string {
  switch (type) {
    case 'invoice': return 'Sąskaita faktūra';
    case 'proforma': return 'Išankstinė sąskaita';
    case 'credit': return 'Kreditinė sąskaita';
  }
}

const MONTH_NAMES_LT = [
  'Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis',
  'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis',
];

export function getMonthName(month: number): string {
  return MONTH_NAMES_LT[month];
}
