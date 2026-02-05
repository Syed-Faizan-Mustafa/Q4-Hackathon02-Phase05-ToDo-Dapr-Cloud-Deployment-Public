'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { signUpSchema, signInSchema, SignUpFormData, SignInFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';

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
    <Card className="w-full max-w-md mx-auto" padding="lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </CardTitle>
        <p className="text-center text-gray-500 mt-2">
          {isSignUp
            ? 'Sign up to start managing your tasks'
            : 'Sign in to access your tasks'}
        </p>
      </CardHeader>

      <CardContent className="mt-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
              {error}
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
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
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
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, and number
            </p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Toggle link */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
