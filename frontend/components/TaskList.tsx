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
}

// Loading skeleton component
function TaskSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded" />
          <div className="w-8 h-8 bg-gray-200 rounded" />
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
}: TaskListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return <EmptyState onAction={onAddTask} />;
  }

  // Task grid
  return (
    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          isToggling={isToggling}
        />
      ))}
    </div>
  );
}
