export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  enabled: boolean;
}

export interface Company {
  name: string;
  address: string;
  companyCode: string;
  vatCode?: string;
  phone?: string;
  email?: string;
  bankAccounts: BankAccount[];
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  companyCode?: string;
  vatCode?: string;
  phone?: string;
  email?: string;
}

export type InvoiceType = 'invoice' | 'proforma' | 'credit';
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  type: InvoiceType;
  series: string;
  number: number;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  seller: Company;
  buyer: Client;
  items: InvoiceItem[];
  totalDiscount: number;
  totalDiscountEnabled: boolean;
  subtotal: number;
  vatRate: number;
  vatEnabled: boolean;
  total: number;
  currency: string;
  notes?: string;
  comment?: string;
  issuedBy?: string;
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  company: Company;
  defaultSeries: string;
  defaultPaymentDays: number;
  defaultVatRate: number;
  currency: string;
  issuedBy: string;
}

export interface RekvizitaiCompany {
  title: string;
  code: string;
  vatCode?: string;
  address?: string;
  phone?: string;
  email?: string;
}
