import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// DB row types
export interface SettingsRow {
  id: string;
  company_name: string;
  company_address: string;
  company_code: string;
  vat_code: string;
  phone: string;
  email: string;
  bank_accounts: Array<{ id: string; bankName: string; iban: string; enabled: boolean }>;
  default_series: string;
  default_payment_days: number;
  default_vat_rate: number;
  currency: string;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRow {
  id: string;
  type: string;
  series: string;
  number: number;
  date: string;
  due_date: string | null;
  status: string;
  seller: Record<string, unknown>;
  buyer: Record<string, unknown> | null;
  total_discount: number;
  total_discount_enabled: boolean;
  subtotal: number;
  vat_rate: number;
  vat_enabled: boolean;
  total: number;
  currency: string;
  notes: string | null;
  comment: string | null;
  issued_by: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  sort_order: number;
}
