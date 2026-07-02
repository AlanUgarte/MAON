'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, MessageSquareText, Package,
  Megaphone, BellRing, Zap, Settings, LogOut,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/bandeja', label: 'Bandeja', icon: MessageSquareText, badge: 7 },
  { href: '/seguimientos', label: 'Seguimientos', icon: BellRing, badge: 12 },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/campanas', label: 'Campañas', icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="relative z-10 hidden w-[248px] shrink-0 flex-col border-r border-line/10 bg-surface/40 px-3 py-5 lg:flex">
      <div className="flex items-center gap-2.5 px-3 pb-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_24px_-8px_rgb(var(--primary)/0.9)]">
          <Zap className="h-5 w-5" fill="currentColor" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-tight text-content">COMPVEN</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">compra & venta · arg</div>
        </div>
      </div>

      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/70">Operación</div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-primary/12 font-medium text-content'
                  : 'text-muted hover:bg-surface-2 hover:text-content',
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-primary' : 'text-muted group-hover:text-content')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="tnum rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-all hover:bg-surface-2 hover:text-content">
          <Settings className="h-[18px] w-[18px]" />
          Configuración
        </Link>

        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-line/10 bg-surface-2/50 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-xs font-bold text-white">
            {initials('Ana Administradora')}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-medium text-content">Ana Administradora</div>
            <div className="truncate text-[11px] text-muted">Administrador</div>
          </div>
          <Link href="/login" aria-label="Salir" className="text-muted transition hover:text-rose">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
