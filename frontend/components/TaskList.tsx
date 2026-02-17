'use client';

import { Task } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onAddTask: () => void;
  isToggling?: boolean;
  hasActiveFilters?: boolean;
}

// Loading skeleton component
function TaskSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 pt-5 shadow-card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-md bg-gray-200 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-200 rounded-lg w-full" />
          <div className="flex gap-2">
            <div className="h-3 bg-gray-200 rounded-lg w-24" />
            <div className="h-3 bg-gray-200 rounded-full w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddTask,
  isToggling,
  hasActiveFilters,
}: TaskListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state - different message when filters are active
  if (tasks.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          title="No matching tasks"
          description="No tasks match your current filters or search. Try adjusting your filters or search terms."
          actionLabel="Create a New Task"
          onAction={onAddTask}
        />
      );
    }
    return <EmptyState onAction={onAddTask} />;
  }

  // Task grid
  return (
    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-slide-up"
          style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
        >
          <TaskCard
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleComplete={onToggleComplete}
            isToggling={isToggling}
          />
        </div>
      ))}
    </div>
  );
}
