'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setUser } from '@/lib/api';

// ponytail: acceso directo sin backend para recorrer la UI mientras no hay DB conectada.
// Borrar esta ruta cuando el login real (contra /auth/login) esté operativo.
export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    setToken('demo-preview-token');
    setUser({ id: '1', email: 'admin@crm.com', fullName: 'Ana Administradora', role: 'ADMINISTRADOR' });
    router.replace('/dashboard');
  }, [router]);

  return null;
}
