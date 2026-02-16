'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUpSchema, signInSchema, SignUpFormData, SignInFormData } from '@/lib/validations';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: SignUpFormData | SignInFormData) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export function AuthForm({
  mode,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: AuthFormProps) {
  const isSignUp = mode === 'signup';
  const schema = isSignUp ? signUpSchema : signInSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData | SignInFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = async (data: SignUpFormData | SignInFormData) => {
    if (onClearError) {
      onClearError();
    }
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 mb-4 shadow-glow">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          {isSignUp
            ? 'Sign up to start managing your tasks with AI'
            : 'Sign in to access your TaskFlow AI workspace'}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-6 sm:p-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email field */}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Password field */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password requirements hint for signup */}
          {isSignUp && (
            <p className="text-xs text-gray-400 -mt-2">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full !rounded-xl"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mt-6 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">or</span>
          </div>
        </div>

        {/* Toggle link */}
        <p className="text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Powered by TaskFlow AI
      </p>
    </div>
  );
}
