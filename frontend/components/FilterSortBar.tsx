'use client';

import { useState } from 'react';
import { TaskFilter, TaskSortField, SortDirection } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FilterSortBarProps {
  filter: TaskFilter;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sortBy: TaskSortField, direction: SortDirection) => void;
  totalTasks: number;
  filteredCount: number;
}

const filterOptions: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

const sortOptions: { value: TaskSortField; label: string }[] = [
  { value: 'createdAt', label: 'Date' },
  { value: 'title', label: 'Title' },
];

export function FilterSortBar({
  filter,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  totalTasks,
  filteredCount,
}: FilterSortBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSortClick = (field: TaskSortField) => {
    if (sortBy === field) {
      // Toggle direction
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc for date, asc for title
      onSortChange(field, field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
      >
        <span>
          Filters & Sort
          {filter !== 'all' && (
            <span className="ml-2 text-primary-600">({filter})</span>
          )}
        </span>
        <svg
          className={cn('w-5 h-5 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter/Sort content */}
      <div
        className={cn(
          'md:flex md:items-center md:justify-between px-4 py-3 border-t md:border-t-0 border-gray-200',
          !isExpanded && 'hidden md:flex'
        )}
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-0">
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                filter === option.value
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Sort:</span>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortClick(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1',
                sortBy === option.value
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {option.label}
              {sortBy === option.value && (
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    sortDirection === 'asc' && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Showing {filteredCount} of {totalTasks} task{totalTasks !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
