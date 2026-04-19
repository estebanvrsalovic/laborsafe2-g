'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? ROUTES.DASHBOARD : ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  return <LoadingSpinner />;
}
