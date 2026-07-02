'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';

// ponytail: solo valida que exista un token en localStorage, no lo verifica contra /auth/me.
// Si el token expiró o es inválido, la primera llamada a la API fallará con 401 y ahí se puede
// interceptar para forzar logout (pendiente cuando el frontend consuma la API real).
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return null;
  return <>{children}</>;
}
