'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, signOut, isLoading } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : '??';

  return (
    <header className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">
                TaskFlow
              </span>
              <span className="text-lg font-light text-primary-200 ml-1">
                AI
              </span>
            </div>
          </div>

          {/* User info and logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-200">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={signOut}
                disabled={isLoading}
                className="!bg-white/15 !text-white !border-white/25 hover:!bg-white/25 !backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
