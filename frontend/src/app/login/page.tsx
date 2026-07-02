'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, setToken, setUser } from '@/lib/api';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const { accessToken, user } = await api.login(email, password);
      setToken(accessToken);
      setUser(user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'No se pudo conectar con el servidor' : err.message || 'No se pudo iniciar sesión');
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

        <h1 className="mt-6 text-center font-display text-[26px] font-bold tracking-tight text-content">Te damos la bienvenida</h1>
        <p className="mt-1.5 text-center text-sm text-muted">Iniciá sesión en COMPVEN para continuar.</p>

        <div className="mt-8 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Dirección de correo electrónico*</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@empresa.com" className="h-12 rounded-xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Contraseña*</label>
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

          <button
            type="button"
            onClick={() => setNotice('Pedile a un administrador que te restablezca la contraseña.')}
            className="text-xs font-medium text-amber hover:underline"
          >
            Restablecer contraseña
          </button>

          {error && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{error}</div>}
          {notice && <div className="rounded-lg border border-line/10 bg-surface-2/60 px-3 py-2 text-xs text-muted">{notice}</div>}

          <Button
            className="h-12 w-full rounded-xl bg-amber text-[15px] font-semibold hover:bg-amber/90"
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Continuar'}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tenés una cuenta?{' '}
          <button
            type="button"
            onClick={() => setNotice('El alta de usuarios la hace un administrador desde el equipo — no hay auto-registro.')}
            className="font-semibold text-amber hover:underline"
          >
            Registrarse
          </button>
        </p>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line/10" />
          <span className="text-xs text-muted">o</span>
          <div className="h-px flex-1 bg-line/10" />
        </div>

        <button
          type="button"
          onClick={() => setNotice('El inicio de sesión con Google todavía no está disponible.')}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line/15 text-sm font-medium text-content transition hover:bg-surface-2"
        >
          <GoogleIcon /> Continuar con Google
        </button>

        <div className="mt-6 rounded-xl border border-line/10 bg-surface-2/40 p-3 text-center text-xs text-muted">
          <span className="font-medium text-content">Demo:</span> admin@crm.com · admin1234
        </div>
      </div>
    </div>
  );
}
