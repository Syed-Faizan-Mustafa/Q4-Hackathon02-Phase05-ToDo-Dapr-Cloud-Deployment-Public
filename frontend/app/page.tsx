'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated, isCheckingAuth } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect once after auth check completes (isAuthenticated is not null)
    if (isAuthenticated !== null && !redirectedRef.current) {
      redirectedRef.current = true;
      if (isAuthenticated) {
        router.replace('/tasks');
      } else {
        router.replace('/signin');
      }
    }
  }, [isAuthenticated, router]);

  // Show loading state while checking auth
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </main>
  );
}
