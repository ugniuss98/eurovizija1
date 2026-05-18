'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import InvoiceForm from '@/components/InvoiceForm';
import { Invoice } from '@/lib/types';

function CreateInvoiceInner() {
  const params = useSearchParams();
  const type = (params.get('type') || 'invoice') as Invoice['type'];
  return <InvoiceForm defaultType={type} />;
}

export default function CreateInvoicePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">Kraunama...</div>}>
        <CreateInvoiceInner />
      </Suspense>
    </AppShell>
  );
}
