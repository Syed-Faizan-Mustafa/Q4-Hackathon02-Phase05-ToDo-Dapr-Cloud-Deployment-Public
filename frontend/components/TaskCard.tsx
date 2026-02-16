'use client';

import { Task } from '@/types';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { TagChip } from '@/components/ui/TagChip';
import { formatDate, truncateText, cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  isToggling?: boolean;
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date();
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  if (taskDate.getTime() === today.getTime()) return 'Today';
  if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isToggling,
}: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-gray-200/80 shadow-card',
        'transition-all duration-300 hover:shadow-card-hover hover:border-gray-300 hover:-translate-y-0.5',
        task.completed && 'opacity-70'
      )}
    >
      {/* Top accent line */}
      <div
        className={cn(
          'absolute top-0 left-4 right-4 h-0.5 rounded-full transition-colors',
          task.completed
            ? 'bg-success-500'
            : overdue
              ? 'bg-error-500'
              : task.priority === 'high'
                ? 'bg-error-400'
                : task.priority === 'low'
                  ? 'bg-success-400'
                  : 'bg-primary-500'
        )}
      />

      <div className="p-4 pt-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            disabled={isToggling}
            className={cn(
              'mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              task.completed
                ? 'bg-success-500 border-success-500 text-white scale-100'
                : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
            )}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed && (
              <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  'text-[15px] font-semibold text-gray-900 leading-tight',
                  task.completed && 'line-through text-gray-400'
                )}
              >
                {task.title}
              </h3>
              <PriorityBadge priority={task.priority} />
              {task.isRecurring && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 border border-primary-200 rounded-lg">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {task.recurrencePattern}
                </span>
              )}
            </div>

            {task.description && (
              <p
                className={cn(
                  'mt-1.5 text-sm text-gray-500 leading-relaxed',
                  task.completed && 'line-through text-gray-400'
                )}
                title={task.description.length > 100 ? task.description : undefined}
              >
                {truncateText(task.description, 100)}
              </p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                {task.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(task.createdAt)}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium rounded-lg px-1.5 py-0.5',
                    overdue
                      ? 'bg-error-100 text-error-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {overdue ? 'Overdue: ' : ''}{formatDueDate(task.dueDate)}
                </span>
              )}

              {task.completed && (
                <span className="badge-success">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="!p-2 !rounded-xl"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task)}
              className="!p-2 !rounded-xl text-error-500 hover:text-error-700 hover:bg-error-50"
              aria-label="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
