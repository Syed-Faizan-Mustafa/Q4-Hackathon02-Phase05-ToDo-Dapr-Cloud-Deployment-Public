import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiError,
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
    // NOTE: 401 handling is done by React components (useAuth hook), not here
    // This prevents redirect loops when session checks happen on unauthenticated pages
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

// API Methods
// All routes go through local Next.js API proxy routes
// which handle session token extraction from cookies server-side

// Tasks - using local /api/tasks proxy routes
export async function getTasks(): Promise<Task[]> {
  const response = await api.get<Task[]>('/api/tasks');
  return response.data;
}

export async function getTask(taskId: string): Promise<Task> {
  const response = await api.get<Task>(`/api/tasks/${taskId}`);
  return response.data;
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await api.post<Task>('/api/tasks', data);
  return response.data;
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> {
  const response = await api.put<Task>(`/api/tasks/${taskId}`, data);
  return response.data;
}

export async function patchTask(
  taskId: string,
  data: Partial<UpdateTaskRequest>
): Promise<Task> {
  const response = await api.patch<Task>(`/api/tasks/${taskId}`, data);
  return response.data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/api/tasks/${taskId}`);
}

// Legacy function signatures for backwards compatibility
// These wrap the new functions but accept userId as first param (ignored)
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
