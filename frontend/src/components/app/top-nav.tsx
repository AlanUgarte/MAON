'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, MessageSquareText, Package,
  Megaphone, BellRing, ReceiptText, Menu, X, LogOut, Store,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { getUser, logout, type AuthUser } from '@/lib/api';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/bandeja', label: 'WhatsApp', icon: MessageSquareText, badge: 7 },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/facturacion', label: 'Facturación', icon: ReceiptText },
  { href: '/tienda-config', label: 'Tienda', icon: Store },
  { href: '/campanas', label: 'Campañas', icon: Megaphone },
  { href: '/seguimientos', label: 'Seguimientos', icon: BellRing, badge: 12 },
];

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador', SUPERVISOR: 'Supervisor', VENDEDOR: 'Vendedor',
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => setUser(getUser()), []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const items = (mobile = false) =>
    NAV.map((item) => {
      const active = pathname.startsWith(item.href);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-medium transition-colors',
            mobile && 'w-full',
            active ? 'bg-primary text-white' : 'text-muted hover:bg-surface-2 hover:text-content',
          )}
        >
          <Icon className="h-[17px] w-[17px]" />
          {item.label}
          {item.badge && (
            <span className={cn(
              'tnum ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              active ? 'bg-white/25 text-white' : 'bg-amber/20 text-amber',
            )}>{item.badge}</span>
          )}
        </Link>
      );
    });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[58px] items-center gap-2 border-b border-line/10 bg-surface px-4">
        <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line/15 text-content lg:hidden">
          {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 pr-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-extrabold text-white">CV</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-primary">COMPVEN</span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">{items()}</nav>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <ThemeToggle />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{initials(user?.fullName || '')}</span>
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-semibold text-content">{user?.fullName ?? '—'}</div>
            {user?.role && <div className="text-[10px] text-muted">{ROLE_LABEL[user.role] ?? user.role}</div>}
          </div>
          <button onClick={handleLogout} aria-label="Salir" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-rose">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {open && (
        <div className="sticky top-[58px] z-30 flex flex-col gap-1 border-b border-line/10 bg-surface p-2 lg:hidden">
          {items(true)}
        </div>
      )}
    </>
  );
}
