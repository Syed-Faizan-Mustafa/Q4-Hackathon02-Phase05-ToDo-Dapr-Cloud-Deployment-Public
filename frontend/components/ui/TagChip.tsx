'use client';

import { cn } from '@/lib/utils';

interface TagChipProps {
  tag: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  clickable?: boolean;
  onClick?: () => void;
  active?: boolean;
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TagChip({ tag, onRemove, size = 'sm', clickable, onClick, active }: TagChipProps) {
  const colorClass = getTagColor(tag);

  const Component = clickable ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium',
        colorClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        active && 'ring-2 ring-offset-1 ring-primary-500'
      )}
    >
      <span>#</span>
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-gray-900 transition-colors"
          aria-label={`Remove tag ${tag}`}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </Component>
  );
}
