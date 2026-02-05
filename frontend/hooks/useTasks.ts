'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  patchTask,
  getErrorMessage,
} from '@/lib/api';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter, TaskSortField, SortDirection } from '@/types';
import { useMemo } from 'react';

// Query key factory - simplified since user is derived from session
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: () => [...taskKeys.lists()] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (taskId: string) => [...taskKeys.details(), taskId] as const,
};

// Note: userId is still accepted for backwards compatibility but is not used
// The backend extracts the user from the session token
export function useTasks(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch tasks query - user is determined by session token
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    enabled: !!userId, // Still require userId to ensure user is authenticated
    retry: 1,
    retryDelay: 2000,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (newTask: CreateTaskRequest) => createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });

  // Update task mutation (full replacement)
  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateTaskRequest;
    }) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });

  // Toggle complete mutation with optimistic update
  const toggleCompleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Find the current task to toggle its state
      // data is now an array directly
      const tasks = Array.isArray(data) ? data : [];
      const task = tasks.find((t: Task) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Use PATCH to update just the completed field
      return patchTask(taskId, { completed: !task.completed });
    },
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(taskKeys.list());

      // Optimistically update - data is now an array
      queryClient.setQueryData(taskKeys.list(), (old: Task[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((task: Task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
      });

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() });
    },
  });

  // data is now an array directly from the API
  const tasks = Array.isArray(data) ? data : [];

  return {
    tasks,
    total: tasks.length,
    isLoading,
    isError,
    error: error ? getErrorMessage(error) : null,
    refetch,
    createTask: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error ? getErrorMessage(createMutation.error) : null,
    updateTask: (taskId: string, data: UpdateTaskRequest) =>
      updateMutation.mutateAsync({ taskId, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? getErrorMessage(updateMutation.error) : null,
    deleteTask: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error ? getErrorMessage(deleteMutation.error) : null,
    toggleComplete: toggleCompleteMutation.mutate,
    isToggling: toggleCompleteMutation.isPending,
  };
}

// Hook for filtering and sorting tasks
export function useFilteredTasks(
  tasks: Task[],
  filter: TaskFilter,
  sortBy: TaskSortField,
  sortDirection: SortDirection
) {
  return useMemo(() => {
    // Filter
    let filtered = tasks;
    if (filter === 'pending') {
      filtered = tasks.filter((task) => !task.completed);
    } else if (filter === 'completed') {
      filtered = tasks.filter((task) => task.completed);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [tasks, filter, sortBy, sortDirection]);
}
