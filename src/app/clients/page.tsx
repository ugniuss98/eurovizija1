'use client';

import AppShell from '@/components/AppShell';
import { Users } from 'lucide-react';

export default function ClientsPage() {
  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Klientai</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
        <Users size={48} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Klientų sąrašas netrukus</p>
        <p className="text-gray-300 text-xs mt-1">Klientai pridedami automatiškai kuriant sąskaitas</p>
      </div>
    </AppShell>
  );
}
