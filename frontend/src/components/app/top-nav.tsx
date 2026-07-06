'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, MessageSquareText, Package,
  Megaphone, BellRing, ReceiptText, Menu, X, LogOut, Store, Bot, ClipboardList, ExternalLink, Zap, Flame,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { getUser, logout, type AuthUser } from '@/lib/api';
import { ThemeToggle } from './theme-toggle';

interface NavItem { href: string; label: string; icon: typeof LayoutDashboard; badge?: number }

const FULL_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/bandeja', label: 'WhatsApp', icon: MessageSquareText, badge: 7 },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/facturacion', label: 'Facturación', icon: ReceiptText },
  { href: '/tienda-config', label: 'Tienda', icon: Store },
  { href: '/estufa', label: 'Estufa (test)', icon: Flame },
  { href: '/campanas', label: 'Campañas', icon: Megaphone },
  { href: '/automatizaciones', label: 'Automatiz.', icon: Bot },
  { href: '/seguimientos', label: 'Seguimientos', icon: BellRing, badge: 12 },
  { href: '/vendedores', label: 'Equipo', icon: Users },
];

// Los vendedores solo ven su propio trabajo: sus clientes, su WhatsApp, su dashboard y sus pedidos de tienda.
const VENDEDOR_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/bandeja', label: 'WhatsApp', icon: MessageSquareText },
  { href: '/tienda-config', label: 'Mis pedidos', icon: ClipboardList },
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
  const isVendedor = user?.role === 'VENDEDOR';
  const NAV = isVendedor ? VENDEDOR_NAV : FULL_NAV;

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
            'flex items-center gap-1 whitespace-nowrap rounded-[10px] px-1.5 py-2 text-[12.5px] font-medium transition-colors',
            mobile && 'w-full !gap-2 !px-3.5 !text-sm',
            active ? 'bg-primary text-white' : 'text-muted hover:bg-surface-2 hover:text-content',
          )}
        >
          <Icon className="h-[16px] w-[16px] shrink-0" />
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
        <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line/15 text-content xl:hidden">
          {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Zap className="h-4 w-4" fill="currentColor" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-extrabold tracking-tight text-primary">MAON</span>
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-muted">Mayorista Online</span>
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-0.5 xl:flex">{items()}</nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          {isVendedor && (
            <a
              href={`/tienda?vendedor=${encodeURIComponent(user?.fullName || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition hover:bg-primary/90"
            >
              <Store className="h-3.5 w-3.5" /> Ir a la tienda <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <ThemeToggle />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{initials(user?.fullName || '')}</span>
          <div className="hidden leading-tight 2xl:block">
            <div className="text-[13px] font-semibold text-content">{user?.fullName ?? '—'}</div>
            {user?.role && <div className="text-[10px] text-muted">{ROLE_LABEL[user.role] ?? user.role}</div>}
          </div>
          <button onClick={handleLogout} aria-label="Salir" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-rose">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {open && (
        <div className="sticky top-[58px] z-30 flex flex-col gap-1 border-b border-line/10 bg-surface p-2 xl:hidden">
          {items(true)}
        </div>
      )}
    </>
  );
}
