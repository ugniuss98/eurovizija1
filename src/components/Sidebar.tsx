'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FilePlus, BarChart2, FileText, Users,
  Package, FolderOpen, Zap, Puzzle, Settings
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Valdymo pultas' },
  { href: '/invoices/create', icon: FilePlus, label: 'Nauja sąskaita' },
  { href: '/statistics', icon: BarChart2, label: 'Statistika' },
  { href: '/invoices', icon: FileText, label: 'Sąskaitos' },
  { href: '/clients', icon: Users, label: 'Klientai' },
  { href: '/products', icon: Package, label: 'Produktai' },
  { href: '/documents', icon: FolderOpen, label: 'Dokumentai' },
  { href: '/integrations', icon: Zap, label: 'Integracijos' },
  { href: '/plugins', icon: Puzzle, label: 'Plėtiniai' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 bg-[#1a1a2e] flex flex-col items-center py-3 z-50">
      <Link href="/dashboard" className="mb-4 w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
        S
      </Link>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                active
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        title="Nustatymai"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          pathname === '/settings'
            ? 'bg-blue-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <Settings size={20} />
      </Link>
    </aside>
  );
}
