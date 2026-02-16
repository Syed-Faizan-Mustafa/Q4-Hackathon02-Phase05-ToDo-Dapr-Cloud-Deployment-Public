'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function SignUpPage() {
  const { signUp, isLoading, isCheckingAuth, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // Redirect if already authenticated (only once, after auth check completes)
  useEffect(() => {
    if (isAuthenticated === true && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/tasks');
    }
  }, [isAuthenticated, router]);

  // Show loading spinner only while checking initial auth state
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse-soft">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  // If authenticated, show spinner while redirecting
  if (isAuthenticated === true) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse-soft">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <AuthForm
        mode="signup"
        onSubmit={signUp}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
      />
    </main>
  );
}
