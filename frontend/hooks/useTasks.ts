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
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilterState } from '@/types';

// Query key factory
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Partial<TaskFilterState>) => [...taskKeys.lists(), filters ?? {}] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (taskId: string) => [...taskKeys.details(), taskId] as const,
};

// Note: userId is still accepted for backwards compatibility but is not used
// The backend extracts the user from the session token
export function useTasks(userId: string | undefined, filters?: Partial<TaskFilterState>) {
  const queryClient = useQueryClient();

  // Fetch tasks query - server-side filtering via query params
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
    enabled: !!userId,
    retry: 1,
    retryDelay: 2000,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (newTask: CreateTaskRequest) => createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  // Toggle complete mutation with optimistic update
  const toggleCompleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const tasks = Array.isArray(data) ? data : [];
      const task = tasks.find((t: Task) => t.id === taskId);
      if (!task) throw new Error('Task not found');
      return patchTask(taskId, { completed: !task.completed });
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const queryKey = taskKeys.list(filters);
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((task: Task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
      });

      return { previousTasks, queryKey };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

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
