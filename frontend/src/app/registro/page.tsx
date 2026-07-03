'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, setToken, setUser } from '@/lib/api';

export default function RegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const { accessToken, user } = await api.register(fullName, email, password, 'ADMINISTRADOR');
      setToken(accessToken);
      setUser(user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'No se pudo conectar con el servidor' : err.message || 'No se pudo crear la cuenta');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F0] p-6 dark:bg-[#15170F]">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_20px_40px_-16px_rgba(0,0,0,0.15)] dark:bg-surface">
        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <Zap className="h-6 w-6" fill="currentColor" />
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-[26px] font-bold tracking-tight text-content">Creá tu cuenta</h1>
        <p className="mt-1.5 text-center text-sm text-muted">Alta única de administrador para COMPVEN.</p>

        <div className="mt-8 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Nombre completo*</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alan Ugarte" className="h-12 rounded-xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Dirección de correo electrónico*</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@empresa.com" className="h-12 rounded-xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Contraseña* (mín. 6 caracteres)</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                className="h-12 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-content"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{error}</div>}

          <Button
            className="h-12 w-full rounded-xl bg-amber text-[15px] font-semibold hover:bg-amber/90"
            onClick={submit}
            disabled={loading || !fullName || !email || password.length < 6}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="font-semibold text-amber hover:underline">Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
