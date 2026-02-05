'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { TaskList } from '@/components/TaskList';
import { TaskModal } from '@/components/TaskModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FilterSortBar } from '@/components/FilterSortBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useFilteredTasks } from '@/hooks/useTasks';
import {
  Task,
  TaskFilter,
  TaskSortField,
  SortDirection,
  defaultFilterState,
  ModalMode,
} from '@/types';
import { CreateTaskFormData } from '@/lib/validations';

export default function TasksPage() {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const redirectedRef = useRef(false);

  // Redirect if not authenticated (only once, after auth check completes)
  useEffect(() => {
    // Only redirect when we're sure the user is NOT authenticated (false, not null)
    if (isAuthenticated === false && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/signin');
    }
  }, [isAuthenticated, router]);

  // Task data
  const {
    tasks,
    total,
    isLoading: tasksLoading,
    isError,
    error: tasksError,
    createTask,
    isCreating,
    createError,
    updateTask,
    isUpdating,
    updateError,
    deleteTask,
    isDeleting,
    deleteError,
    toggleComplete,
    isToggling,
    refetch,
  } = useTasks(user?.id);

  // Filter/Sort state
  const [filter, setFilter] = useState<TaskFilter>(defaultFilterState.filter);
  const [sortBy, setSortBy] = useState<TaskSortField>(defaultFilterState.sortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultFilterState.sortDirection
  );

  // Filtered tasks
  const filteredTasks = useFilteredTasks(tasks, filter, sortBy, sortDirection);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Handlers
  const handleAddTask = () => {
    setModalMode('create');
    setSelectedTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (data: CreateTaskFormData) => {
    try {
      if (modalMode === 'create') {
        await createTask(data);
      } else if (selectedTask) {
        await updateTask(selectedTask.id, data);
      }
      setModalOpen(false);
      setSelectedTask(null);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id);
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch {
        // Error is handled by the hook
      }
    }
  };

  const handleSortChange = (newSortBy: TaskSortField, newDirection: SortDirection) => {
    setSortBy(newSortBy);
    setSortDirection(newDirection);
  };

  // Loading state - show while checking auth
  if (isCheckingAuth || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Not authenticated - show nothing while redirecting
  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your tasks and stay organized
            </p>
          </div>
          <Button onClick={handleAddTask} size="md">
            <svg
              className="w-4 h-4 mr-2"
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
            Add Task
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="mb-6 p-4 rounded-lg bg-error-50 border border-error-200">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-error-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-error-800">
                  Failed to load tasks
                </p>
                <p className="text-sm text-error-600">{tasksError}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Filter/Sort bar */}
        {!isError && (
          <div className="mb-6">
            <FilterSortBar
              filter={filter}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onFilterChange={setFilter}
              onSortChange={handleSortChange}
              totalTasks={total}
              filteredCount={filteredTasks.length}
            />
          </div>
        )}

        {/* Task list */}
        <TaskList
          tasks={filteredTasks}
          isLoading={tasksLoading}
          onEdit={handleEditTask}
          onDelete={handleDeleteClick}
          onToggleComplete={toggleComplete}
          onAddTask={handleAddTask}
          isToggling={isToggling}
        />
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        mode={modalMode}
        task={selectedTask}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleModalSubmit}
        isLoading={isCreating || isUpdating}
        error={createError || updateError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        task={taskToDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}
