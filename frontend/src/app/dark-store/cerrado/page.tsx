'use client';

import { useRouter } from 'next/navigation';
import { Moon, Clock } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, TEXT, MUTED } from '../_lib';
import { useDarkStoreShell } from '../_useShell';

export default function DarkStoreClosedPage() {
  const router = useRouter();
  const { settings } = useDarkStoreShell();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ background: BG, color: TEXT }}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
        <Moon className="h-8 w-8" style={{ color: MUTED }} />
      </div>
      <h1 className="text-2xl font-extrabold">Estamos cerrados</h1>
      <p className="mt-2 max-w-sm text-[13.5px]" style={{ color: MUTED }}>
        Tomamos pedidos de {settings.scheduleStart} a {settings.scheduleEnd} hs. Volvé más tarde — o mirá el catálogo mientras tanto.
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
        <Clock className="h-3.5 w-3.5" /> Próxima apertura: {settings.scheduleStart} hs
      </div>
      <button onClick={() => router.push('/dark-store')} className="mt-6 rounded-full px-5 py-2.5 text-[13px] font-bold" style={{ background: ACCENT, color: TEXT }}>
        Ver el catálogo
      </button>
    </div>
  );
}
