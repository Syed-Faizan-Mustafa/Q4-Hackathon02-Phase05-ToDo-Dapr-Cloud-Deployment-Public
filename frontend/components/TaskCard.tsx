'use client';

import { Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, truncateText, cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  isToggling?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isToggling,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        task.completed && 'opacity-75'
      )}
      padding="md"
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          disabled={isToggling}
          className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            task.completed
              ? 'bg-success-500 border-success-500 text-white'
              : 'border-gray-300 hover:border-primary-500'
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
          <h3
            className={cn(
              'text-base font-medium text-gray-900',
              task.completed && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              className={cn(
                'mt-1 text-sm text-gray-500',
                task.completed && 'line-through'
              )}
              title={task.description.length > 100 ? task.description : undefined}
            >
              {truncateText(task.description, 100)}
              {task.description.length > 100 && (
                <span className="text-primary-600 ml-1">...</span>
              )}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span>Created {formatDate(task.createdAt)}</span>
            {task.completed && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-100 text-success-700">
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="!p-2"
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
            className="!p-2 text-error-600 hover:text-error-700 hover:bg-error-50"
            aria-label="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
}
