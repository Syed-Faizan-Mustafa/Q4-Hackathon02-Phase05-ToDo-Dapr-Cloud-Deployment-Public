'use client';

import { PriorityLevel } from '@/types';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<PriorityLevel, { label: string; className: string; icon: string }> = {
  high: {
    label: 'High',
    className: 'bg-error-100 text-error-700 border-error-200',
    icon: 'M5 15l7-7 7 7',
  },
  medium: {
    label: 'Medium',
    className: 'bg-warning-100 text-warning-700 border-warning-200',
    icon: 'M5 12h14',
  },
  low: {
    label: 'Low',
    className: 'bg-success-100 text-success-700 border-success-200',
    icon: 'M19 9l-7 7-7-7',
  },
};

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-lg',
        config.className,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      )}
      aria-label={`Priority: ${config.label}`}
    >
      <svg
        className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={config.icon} />
      </svg>
      {config.label}
    </span>
  );
}
