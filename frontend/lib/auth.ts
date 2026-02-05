'use client';

import { createAuthClient } from 'better-auth/react';

// Create Better Auth client
// baseURL is not needed when auth is on the same origin
export const authClient = createAuthClient();

// Export auth methods
export const { signIn, signUp, signOut, useSession } = authClient;

// Helper to get current session token from cookie
export async function getSessionToken(): Promise<string | null> {
  try {
    // Better Auth stores the session token in a cookie named 'better-auth.session_token'
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'better-auth.session_token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to check if user is authenticated
export function useAuth() {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user || null,
    session: session?.session || null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error: error?.message || null,
  };
}

// Type exports for session data
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface AuthSession {
  id: string;
  token: string;
  expiresAt: Date;
  userId: string;
}
