'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Grid2x2, Search, ShoppingCart } from 'lucide-react';
import { BG_SOFT, CARD_BORDER, ACCENT, NEON, MUTED } from '../_lib';

export function MobileNav({ cartCount }: { cartCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = [
    { href: '/dark-store', label: 'Inicio', icon: Home },
    { href: '/dark-store/categoria/bebidas', label: 'Categorías', icon: Grid2x2 },
    { href: '/dark-store/buscar', label: 'Buscar', icon: Search },
    { href: '/dark-store/carrito', label: 'Carrito', icon: ShoppingCart },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 py-2 md:hidden"
      style={{ background: BG_SOFT, borderTop: `1px solid ${CARD_BORDER}` }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dark-store' && pathname?.startsWith(href));
        return (
          <button key={href} onClick={() => router.push(href)} className="relative flex flex-col items-center gap-0.5 px-3 py-1">
            <Icon className="h-5 w-5" style={{ color: active ? ACCENT : MUTED }} />
            <span className="text-[9px] font-semibold" style={{ color: active ? ACCENT : MUTED }}>{label}</span>
            {href === '/dark-store/carrito' && cartCount > 0 && (
              <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold" style={{ background: NEON, color: '#0A0A0A' }}>
                {cartCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
