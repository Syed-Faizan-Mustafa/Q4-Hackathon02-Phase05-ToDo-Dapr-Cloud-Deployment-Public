'use client';

import { useState, useRef, useEffect } from 'react';
import { TaskFilter, TaskSortField, SortDirection, PriorityLevel } from '@/types';
import { cn } from '@/lib/utils';

interface FilterSortBarProps {
  filter: TaskFilter;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
  priority: PriorityLevel | null;
  search: string;
  overdue: boolean;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sortBy: TaskSortField, direction: SortDirection) => void;
  onPriorityChange: (priority: PriorityLevel | null) => void;
  onSearchChange: (search: string) => void;
  onOverdueChange: (overdue: boolean) => void;
  totalTasks: number;
  filteredCount: number;
}

const filterOptions: { value: TaskFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'pending', label: 'Pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'completed', label: 'Done', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const priorityOptions: { value: PriorityLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-error-100 text-error-700' },
  { value: 'medium', label: 'Medium', color: 'bg-warning-100 text-warning-700' },
  { value: 'low', label: 'Low', color: 'bg-success-100 text-success-700' },
];

const sortOptions: { value: TaskSortField; label: string }[] = [
  { value: 'createdAt', label: 'Date' },
  { value: 'title', label: 'Title' },
  { value: 'dueDate', label: 'Due' },
  { value: 'priority', label: 'Priority' },
];

export function FilterSortBar({
  filter,
  sortBy,
  sortDirection,
  priority,
  search,
  overdue,
  onFilterChange,
  onSortChange,
  onPriorityChange,
  onSearchChange,
  onOverdueChange,
  totalTasks,
  filteredCount,
}: FilterSortBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, onSearchChange]);

  // Sync external search changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSortClick = (field: TaskSortField) => {
    if (sortBy === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const hasActiveFilters = priority !== null || overdue || search.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters & Sort
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </span>
        <svg
          className={cn('w-5 h-5 transition-transform duration-200', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={cn(
          'md:block px-4 py-3 border-t md:border-t-0 border-gray-100 space-y-3',
          !isExpanded && 'hidden md:block'
        )}
      >
        {/* Search bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 focus:bg-white"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status filters + Priority + Overdue row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status filters */}
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-all duration-200',
                filter === option.value
                  ? 'bg-primary-600 text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
              </svg>
              {option.label}
            </button>
          ))}

          <span className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Priority filters */}
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPriorityChange(priority === opt.value ? null : opt.value)}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200',
                priority === opt.value
                  ? `${opt.color} border-current ring-1 ring-offset-1 ring-primary-500`
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              )}
            >
              {opt.label}
            </button>
          ))}

          <span className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Overdue toggle */}
          <button
            onClick={() => onOverdueChange(!overdue)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200',
              overdue
                ? 'bg-error-100 text-error-700 border-error-200 ring-1 ring-offset-1 ring-primary-500'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
            )}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Overdue
          </button>
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">Sort by</span>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortClick(option.value)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm rounded-xl transition-all duration-200',
                sortBy === option.value
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {option.label}
              {sortBy === option.value && (
                <svg
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
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
      <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
        <span>Showing {filteredCount} of {totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
        {hasActiveFilters && (
          <button
            onClick={() => {
              onPriorityChange(null);
              onOverdueChange(false);
              onSearchChange('');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
