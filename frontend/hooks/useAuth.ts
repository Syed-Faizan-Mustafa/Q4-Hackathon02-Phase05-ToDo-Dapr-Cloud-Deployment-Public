'use client';

import { useSession, signIn, signUp, signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useRef, useEffect } from 'react';
import { SignUpFormData, SignInFormData } from '@/lib/validations';

export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Track if initial session check is complete
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Mark as initialized once isPending becomes false for the first time
  useEffect(() => {
    if (!isPending && !initRef.current) {
      initRef.current = true;
      setIsInitialized(true);
    }
  }, [isPending]);

  const user = session?.user || null;

  // isAuthenticated: true only when initialized AND user exists
  // null when not yet initialized (to distinguish from "definitely not authenticated")
  const isAuthenticated = !isInitialized ? null : !!user;

  // isCheckingAuth: true during initial session check only
  const isCheckingAuth = !isInitialized && isPending;

  const handleSignUp = useCallback(
    async (data: SignUpFormData) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const result = await signUp.email({
          email: data.email,
          password: data.password,
          name: data.email.split('@')[0],
        });

        if (result.error) {
          setAuthError(result.error.message || 'Sign up failed');
          return false;
        }

        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetch();

        // Use replace to avoid back button issues
        router.replace('/tasks');
        return true;
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign up failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, refetch]
  );

  const handleSignIn = useCallback(
    async (data: SignInFormData) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const result = await signIn.email({
          email: data.email,
          password: data.password,
        });

        if (result.error) {
          setAuthError(result.error.message || 'Invalid credentials');
          return false;
        }

        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 100));
        await refetch();

        // Use replace to avoid back button issues
        router.replace('/tasks');
        return true;
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign in failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, refetch]
  );

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await signOut();
      // Reset initialization state
      initRef.current = false;
      setIsInitialized(false);
      router.replace('/signin');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    user,
    isAuthenticated, // null = checking, true = authenticated, false = not authenticated
    isCheckingAuth, // true only during initial session check
    // Only show loading during explicit sign-in/sign-up/sign-out actions
    isLoading,
    error: authError || (error?.message ?? null),
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    clearError,
  };
}
