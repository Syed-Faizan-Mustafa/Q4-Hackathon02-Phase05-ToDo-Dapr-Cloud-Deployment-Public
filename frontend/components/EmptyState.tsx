'use client';

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No tasks yet',
  description = 'Start by creating your first task. Use the button below or ask the AI assistant!',
  actionLabel = 'Create Your First Task',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
          <svg
            className="w-14 h-14 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        {/* Floating decorative dots */}
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent-400/30 animate-pulse-soft" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-primary-400/30 animate-pulse-soft" style={{ animationDelay: '0.5s' }} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-8 max-w-sm leading-relaxed">{description}</p>
      {onAction && (
        <Button onClick={onAction} size="lg">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
