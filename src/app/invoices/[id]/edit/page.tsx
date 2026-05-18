'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import InvoiceForm from '@/components/InvoiceForm';
import { getInvoice } from '@/lib/storage';
import { Invoice } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    getInvoice(id).then(setInvoice);
  }, [id]);

  if (invoice === undefined) return (
    <AppShell>
      <div className="py-20 text-center"><Loader2 size={28} className="text-blue-400 animate-spin mx-auto" /></div>
    </AppShell>
  );
  if (!invoice) return <AppShell><div className="p-8 text-center text-gray-400">Sąskaita nerasta</div></AppShell>;

  return (
    <AppShell>
      <InvoiceForm initial={invoice} />
    </AppShell>
  );
}
