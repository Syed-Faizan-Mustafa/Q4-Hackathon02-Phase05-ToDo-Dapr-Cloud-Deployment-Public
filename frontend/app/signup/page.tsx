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
    // Only redirect when we're sure the user is authenticated (not null/checking)
    if (isAuthenticated === true && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/tasks');
    }
  }, [isAuthenticated, router]);

  // Show loading spinner only while checking initial auth state
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </main>
    );
  }

  // If authenticated, show spinner while redirecting
  if (isAuthenticated === true) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
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
