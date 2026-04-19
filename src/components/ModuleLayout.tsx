'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

interface ModuleLayoutProps {
  title: string;
  description?: string;
  backHref?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export default function ModuleLayout({ title, description, backHref, headerAction, children }: ModuleLayoutProps) {
  const { user, loading, handleLogout } = useAuthGuard();
  const router = useRouter();

  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#1f2937] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(backHref || ROUTES.DASHBOARD)} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <div>
              <span className="text-white font-semibold">{title}</span>
              {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {headerAction}
          {user.photoURL && (
            <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          )}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
            Salir
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
