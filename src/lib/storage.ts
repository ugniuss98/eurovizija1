import { supabase, SettingsRow, InvoiceRow, InvoiceItemRow } from './supabase';
import { Invoice, Settings, InvoiceItem, BankAccount } from './types';

// ── Settings ──────────────────────────────────────────────────────────────────

function rowToSettings(row: SettingsRow): Settings {
  return {
    company: {
      name: row.company_name,
      address: row.company_address,
      companyCode: row.company_code,
      vatCode: row.vat_code,
      phone: row.phone,
      email: row.email,
      bankAccounts: (row.bank_accounts as BankAccount[]) ?? [],
    },
    defaultSeries: row.default_series,
    defaultPaymentDays: row.default_payment_days,
    defaultVatRate: row.default_vat_rate,
    currency: row.currency,
    issuedBy: row.issued_by,
  };
}

const defaultSettings: Settings = {
  company: {
    name: 'Mano Įmonė',
    address: 'Gedimino pr. 1, LT-01001 Vilnius',
    companyCode: '123456789',
    vatCode: 'LT123456789',
    phone: '+370 600 00000',
    email: 'info@manoiimone.lt',
    bankAccounts: [{ id: '1', bankName: 'Swedbank', iban: 'LT000000000000000000', enabled: true }],
  },
  defaultSeries: 'BA',
  defaultPaymentDays: 30,
  defaultVatRate: 21,
  currency: 'EUR',
  issuedBy: 'Vardas Pavardenis',
};

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  if (error || !data) return defaultSettings;
  return rowToSettings(data as SettingsRow);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { data: existing } = await supabase.from('settings').select('id').limit(1).single();
  const payload = {
    company_name: settings.company.name,
    company_address: settings.company.address,
    company_code: settings.company.companyCode,
    vat_code: settings.company.vatCode ?? '',
    phone: settings.company.phone ?? '',
    email: settings.company.email ?? '',
    bank_accounts: settings.company.bankAccounts,
    default_series: settings.defaultSeries,
    default_payment_days: settings.defaultPaymentDays,
    default_vat_rate: settings.defaultVatRate,
    currency: settings.currency,
    issued_by: settings.issuedBy,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await supabase.from('settings').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('settings').insert(payload);
  }
}

// ── Invoices ──────────────────────────────────────────────────────────────────

function rowToInvoice(row: InvoiceRow, items: InvoiceItemRow[]): Invoice {
  return {
    id: row.id,
    type: row.type as Invoice['type'],
    series: row.series,
    number: row.number,
    date: row.date,
    dueDate: row.due_date ?? '',
    status: row.status as Invoice['status'],
    seller: row.seller as unknown as Invoice['seller'],
    buyer: row.buyer as unknown as Invoice['buyer'],
    items: items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => ({
        id: i.id,
        name: i.name,
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
        total: i.total,
      } as InvoiceItem)),
    totalDiscount: row.total_discount,
    totalDiscountEnabled: row.total_discount_enabled,
    subtotal: row.subtotal,
    vatRate: row.vat_rate,
    vatEnabled: row.vat_enabled,
    total: row.total,
    currency: row.currency,
    notes: row.notes ?? undefined,
    comment: row.comment ?? undefined,
    issuedBy: row.issued_by ?? undefined,
    acceptedBy: row.accepted_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data: rows, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !rows) return [];

  const ids = rows.map(r => r.id);
  if (ids.length === 0) return [];

  const { data: itemRows } = await supabase
    .from('invoice_items')
    .select('*')
    .in('invoice_id', ids);

  const itemsByInvoice: Record<string, InvoiceItemRow[]> = {};
  (itemRows ?? []).forEach(item => {
    if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
    itemsByInvoice[item.invoice_id].push(item as InvoiceItemRow);
  });

  return rows.map(r => rowToInvoice(r as InvoiceRow, itemsByInvoice[r.id] ?? []));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data: row, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !row) return null;

  const { data: itemRows } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order');

  return rowToInvoice(row as InvoiceRow, (itemRows ?? []) as InvoiceItemRow[]);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const payload = {
    id: invoice.id,
    type: invoice.type,
    series: invoice.series,
    number: invoice.number,
    date: invoice.date,
    due_date: invoice.dueDate || null,
    status: invoice.status,
    seller: invoice.seller,
    buyer: invoice.buyer,
    total_discount: invoice.totalDiscount,
    total_discount_enabled: invoice.totalDiscountEnabled,
    subtotal: invoice.subtotal,
    vat_rate: invoice.vatRate,
    vat_enabled: invoice.vatEnabled,
    total: invoice.total,
    currency: invoice.currency,
    notes: invoice.notes ?? null,
    comment: invoice.comment ?? null,
    issued_by: invoice.issuedBy ?? null,
    accepted_by: invoice.acceptedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('invoices')
    .upsert({ ...payload, created_at: invoice.createdAt });
  if (error) throw error;

  // Upsert items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
  if (invoice.items.length > 0) {
    await supabase.from('invoice_items').insert(
      invoice.items.map((item, idx) => ({
        id: item.id,
        invoice_id: invoice.id,
        name: item.name,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        total: item.total,
        sort_order: idx,
      }))
    );
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  await supabase.from('invoices').delete().eq('id', id);
}

export async function getNextNumber(series: string): Promise<number> {
  const { data } = await supabase
    .from('invoices')
    .select('number')
    .eq('series', series)
    .order('number', { ascending: false })
    .limit(1)
    .single();
  return data ? data.number + 1 : 1;
}
