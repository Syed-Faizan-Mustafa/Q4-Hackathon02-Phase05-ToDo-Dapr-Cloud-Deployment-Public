import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiError,
  TaskFilterState,
  SORT_FIELD_MAP,
} from '@/types';

// API configuration - use local proxy routes (they handle session tokens server-side)
const RETRY_DELAY = 1000; // 1 second - faster retry
const MAX_RETRIES = 2; // 2 retries for Neon cold starts

// Create axios instance with optimized settings
// Using local API routes as proxy to FastAPI backend
const api: AxiosInstance = axios.create({
  baseURL: '', // Empty base URL - all routes are relative to the frontend
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000, // 60 seconds for Neon cold starts
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    const status = error.response?.status;

    // Don't retry on client errors (4xx) - let components handle auth redirects
    if (status && status >= 400 && status < 500) {
      return Promise.reject(error);
    }

    // Retry logic for network/server errors and timeouts
    const retryCount = originalRequest._retryCount || 0;
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
    const isServerError = status && status >= 500;

    if ((isTimeout || isNetworkError || isServerError) && retryCount < MAX_RETRIES) {
      originalRequest._retry = true;
      originalRequest._retryCount = retryCount + 1;

      // Exponential backoff: 1s, 2s
      const delay = RETRY_DELAY * (retryCount + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    if (apiError?.message) {
      return apiError.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Build query string from filter state
function buildTaskQueryString(filters?: Partial<TaskFilterState>): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.filter && filters.filter !== 'all') {
    params.set('status', filters.filter);
  }
  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => params.append('tag', tag));
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.overdue) {
    params.set('overdue', 'true');
  }
  if (filters.sortBy) {
    params.set('sort_by', SORT_FIELD_MAP[filters.sortBy] || 'created_at');
  }
  if (filters.sortDirection) {
    params.set('sort_dir', filters.sortDirection);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// Transform snake_case backend response to camelCase frontend types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTask(raw: any): Task {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId ?? '',
    title: raw.title ?? '',
    description: raw.description ?? undefined,
    completed: raw.completed ?? false,
    priority: raw.priority ?? 'medium',
    tags: raw.tags ?? [],
    dueDate: raw.due_date ?? raw.dueDate ?? null,
    remindAt: raw.remind_at ?? raw.remindAt ?? null,
    reminderSent: raw.reminder_sent ?? raw.reminderSent ?? false,
    isRecurring: raw.is_recurring ?? raw.isRecurring ?? false,
    recurrencePattern: raw.recurrence_pattern ?? raw.recurrencePattern ?? null,
    recurrenceInterval: raw.recurrence_interval ?? raw.recurrenceInterval ?? 1,
    parentTaskId: raw.parent_task_id ?? raw.parentTaskId ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
  };
}

// API Methods
// All routes go through local Next.js API proxy routes

// Tasks - using local /api/tasks proxy routes
export async function getTasks(filters?: Partial<TaskFilterState>): Promise<Task[]> {
  const qs = buildTaskQueryString(filters);
  const response = await api.get(`/api/tasks${qs}`);
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(transformTask);
}

export async function getTask(taskId: string): Promise<Task> {
  const response = await api.get(`/api/tasks/${taskId}`);
  return transformTask(response.data);
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await api.post('/api/tasks', data);
  return transformTask(response.data);
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> {
  const response = await api.put(`/api/tasks/${taskId}`, data);
  return transformTask(response.data);
}

export async function patchTask(
  taskId: string,
  data: Partial<UpdateTaskRequest>
): Promise<Task> {
  const response = await api.patch(`/api/tasks/${taskId}`, data);
  return transformTask(response.data);
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/api/tasks/${taskId}`);
}

// Legacy function signatures for backwards compatibility
export async function getTasksWithUserId(userId: string): Promise<Task[]> {
  return getTasks();
}

export async function createTaskWithUserId(
  userId: string,
  data: CreateTaskRequest
): Promise<Task> {
  return createTask(data);
}

export async function updateTaskWithUserId(
  userId: string,
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> {
  return updateTask(taskId, data);
}

export async function deleteTaskWithUserId(userId: string, taskId: string): Promise<void> {
  return deleteTask(taskId);
}

// Export the api instance for custom requests
export { api };
