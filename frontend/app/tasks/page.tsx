'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { TaskList } from '@/components/TaskList';
import { TaskModal } from '@/components/TaskModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FilterSortBar } from '@/components/FilterSortBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import {
  Task,
  TaskFilter,
  TaskSortField,
  SortDirection,
  PriorityLevel,
  TaskFilterState,
  defaultFilterState,
  ModalMode,
  CreateTaskRequest,
} from '@/types';
import { CreateTaskFormData } from '@/lib/validations';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TasksPage() {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const redirectedRef = useRef(false);

  // Redirect if not authenticated (only once, after auth check completes)
  useEffect(() => {
    if (isAuthenticated === false && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace('/signin');
    }
  }, [isAuthenticated, router]);

  // Filter/Sort state
  const [filter, setFilter] = useState<TaskFilter>(defaultFilterState.filter);
  const [sortBy, setSortBy] = useState<TaskSortField>(defaultFilterState.sortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultFilterState.sortDirection);
  const [priority, setPriority] = useState<PriorityLevel | null>(defaultFilterState.priority);
  const [search, setSearch] = useState(defaultFilterState.search);
  const [overdue, setOverdue] = useState(defaultFilterState.overdue);

  // Build filter state for API (server-side: status + sort only)
  const filterState = useMemo<Partial<TaskFilterState>>(() => ({
    filter,
    sortBy,
    sortDirection,
  }), [filter, sortBy, sortDirection]);

  // Task data - server-side filtering
  const {
    tasks: rawTasks,
    total: rawTotal,
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
    toggleComplete,
    isToggling,
    refetch,
  } = useTasks(user?.id, filterState);

  // Client-side filtering for search, priority, overdue
  const tasks = useMemo(() => {
    let filtered = rawTasks;

    // Search filter (title + description, case-insensitive)
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Priority filter
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    // Overdue filter
    if (overdue) {
      const now = new Date();
      filtered = filtered.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && !t.completed
      );
    }

    return filtered;
  }, [rawTasks, search, priority, overdue]);

  const total = rawTotal;

  // Task stats from current results
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    return { total: tasks.length, pending, completed };
  }, [tasks]);

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
    // Transform form data to API request format (camelCase → snake_case)
    const apiData: CreateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      tags: data.tags,
      due_date: data.dueDate || undefined,
      is_recurring: data.isRecurring,
      recurrence_pattern: data.recurrencePattern || undefined,
      recurrence_interval: data.recurrenceInterval,
    };

    try {
      if (modalMode === 'create') {
        await createTask(apiData);
      } else if (selectedTask) {
        await updateTask(selectedTask.id, apiData);
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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Loading state
  if (isCheckingAuth || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse-soft">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Loading TaskFlow AI...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-primary-600 mb-1">
              {getGreeting()}, {userName}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Tasks
            </h1>
          </div>
          <Button onClick={handleAddTask} size="md" className="animate-fade-in self-start sm:self-auto">
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
            New Task
          </Button>
        </div>

        {/* Stats cards */}
        {!tasksLoading && !isError && tasks.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 animate-slide-up">
            <div className="stat-card bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50">
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary-900 mt-1">{stats.total}</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-200/50">
              <p className="text-xs font-medium text-warning-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning-900 mt-1">{stats.pending}</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-success-50 to-success-100/50 border border-success-200/50">
              <p className="text-xs font-medium text-success-600 uppercase tracking-wider">Done</p>
              <p className="text-2xl sm:text-3xl font-bold text-success-700 mt-1">{stats.completed}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="mb-6 p-4 rounded-2xl bg-error-50 border border-error-200 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-error-600"
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
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-error-800">
                  Failed to load tasks
                </p>
                <p className="text-sm text-error-600 mt-0.5">{tasksError}</p>
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
              priority={priority}
              search={search}
              overdue={overdue}
              onFilterChange={setFilter}
              onSortChange={handleSortChange}
              onPriorityChange={setPriority}
              onSearchChange={handleSearchChange}
              onOverdueChange={setOverdue}
              totalTasks={total}
              filteredCount={tasks.length}
            />
          </div>
        )}

        {/* Task list */}
        <TaskList
          tasks={tasks}
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
