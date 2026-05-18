'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Euro, Plus, HelpCircle, Bell, Settings2, User, ChevronDown, FileText, CreditCard } from 'lucide-react';

export default function TopBar() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 sticky top-0 z-40">
      <Link href="/dashboard" className="text-blue-600 font-bold text-lg mr-2 shrink-0">
        Sąskaitos
      </Link>

      <div className="flex-1 max-w-xl relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Įveskite sąskaitos seriją ar numerį..."
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-gray-50"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 font-medium text-sm">
          <Euro size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowCreate(v => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 gap-0.5"
          >
            <Plus size={18} />
            <ChevronDown size={13} />
          </button>
          {showCreate && (
            <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 dropdown-menu">
              <button
                onClick={() => { router.push('/invoices/create'); setShowCreate(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <FileText size={16} className="text-blue-500" />
                <span>Nauja sąskaita faktūra</span>
              </button>
              <button
                onClick={() => { router.push('/invoices/create?type=proforma'); setShowCreate(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <CreditCard size={16} className="text-green-500" />
                <span>Išankstinė sąskaita</span>
              </button>
            </div>
          )}
        </div>

        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100">
          <HelpCircle size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100">
          <Settings2 size={18} />
        </button>
        <div className="w-5 h-4 rounded-sm overflow-hidden ml-1">
          <div className="w-full h-1/3 bg-yellow-400" />
          <div className="w-full h-1/3 bg-green-600" />
          <div className="w-full h-1/3 bg-red-600" />
        </div>
        <Link href="/settings" className="flex items-center gap-1.5 ml-1 text-sm text-gray-700 hover:text-gray-900">
          <User size={16} />
          <span className="font-medium">Vartotojas</span>
          <ChevronDown size={14} className="text-gray-400" />
        </Link>
      </div>
    </header>
  );
}
