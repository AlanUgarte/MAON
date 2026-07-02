import { TopNav } from '@/components/app/top-nav';
import { AuthGuard } from '@/components/app/auth-guard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AuthGuard>
  );
}
