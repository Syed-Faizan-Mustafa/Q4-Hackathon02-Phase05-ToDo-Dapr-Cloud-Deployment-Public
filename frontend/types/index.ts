// Core Entities

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

// API Request/Response Types

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// UI State Types

export type TaskFilter = 'all' | 'pending' | 'completed';

export type TaskSortField = 'createdAt' | 'title';

export type SortDirection = 'asc' | 'desc';

export interface TaskFilterState {
  filter: TaskFilter;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
}

export const defaultFilterState: TaskFilterState = {
  filter: 'all',
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

export type ModalMode = 'create' | 'edit';

export interface TaskModalState {
  isOpen: boolean;
  mode: ModalMode;
  task?: Task;
}

export interface TaskFormData {
  title: string;
  description: string;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface FormError {
  field: string;
  message: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
