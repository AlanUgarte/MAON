'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/api';

// Los vendedores solo pueden entrar a su propio trabajo: dashboard, clientes, WhatsApp y sus pedidos de tienda.
const VENDEDOR_ALLOWED = ['/dashboard', '/clientes', '/bandeja', '/tienda-config'];

// ponytail: solo valida que exista un token en localStorage, no lo verifica contra /auth/me.
// Si el token expiró o es inválido, la primera llamada a la API fallará con 401 y ahí se puede
// interceptar para forzar logout (pendiente cuando el frontend consuma la API real).
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const user = getUser();
    if (user?.role === 'VENDEDOR' && !VENDEDOR_ALLOWED.some((p) => pathname.startsWith(p))) {
      router.replace('/dashboard');
      return;
    }
    setAuthorized(true);
  }, [router, pathname]);

  if (!authorized) return null;
  return <>{children}</>;
}
