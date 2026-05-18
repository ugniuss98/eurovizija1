'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import InvoiceForm from '@/components/InvoiceForm';
import { getInvoices } from '@/lib/storage';
import { Invoice } from '@/lib/types';

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    const inv = getInvoices().find(i => i.id === id);
    setInvoice(inv ?? null);
  }, [id]);

  if (invoice === undefined) return <AppShell><div className="p-8 text-center text-gray-400">Kraunama...</div></AppShell>;
  if (invoice === null) return <AppShell><div className="p-8 text-center text-gray-400">Sąskaita nerasta</div></AppShell>;

  return (
    <AppShell>
      <InvoiceForm initial={invoice} />
    </AppShell>
  );
}
