'use client';
import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-line/10 bg-bg px-5 lg:px-7">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-content">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>

      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Buscar clientes, productos…"
          className="h-9 w-full rounded-xl border border-line/15 bg-surface-2/60 pl-9 pr-3 text-sm text-content placeholder:text-muted/70 focus:border-primary/50 focus:outline-none"
        />
      </div>

      <Button variant="outline" size="icon" aria-label="Notificaciones" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose" />
      </Button>
      <Button className="hidden sm:inline-flex">
        <Plus className="h-4 w-4" /> Nuevo lead
      </Button>
    </header>
  );
}
