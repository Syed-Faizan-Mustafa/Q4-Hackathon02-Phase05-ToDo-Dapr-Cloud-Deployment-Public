// Core Entities

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export type PriorityLevel = 'high' | 'medium' | 'low';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: PriorityLevel;
  tags: string[];
  dueDate: string | null;
  remindAt: string | null;
  reminderSent: boolean;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceInterval: number;
  parentTaskId: string | null;
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
  priority?: PriorityLevel;
  tags?: string[];
  due_date?: string;
  remind_at?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_interval?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: PriorityLevel;
  tags?: string[];
  due_date?: string;
  remind_at?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_interval?: number;
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

// Filter/Sort/Search Types

export type TaskFilter = 'all' | 'pending' | 'completed';

export type TaskSortField = 'createdAt' | 'title' | 'dueDate' | 'priority';

export type SortDirection = 'asc' | 'desc';

export interface TaskFilterState {
  filter: TaskFilter;
  priority: PriorityLevel | null;
  tags: string[];
  search: string;
  overdue: boolean;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
}

export const defaultFilterState: TaskFilterState = {
  filter: 'all',
  priority: null,
  tags: [],
  search: '',
  overdue: false,
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
  priority: PriorityLevel;
  tags: string[];
  dueDate: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceInterval: number;
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

// Sort field mapping (frontend camelCase → backend snake_case)
export const SORT_FIELD_MAP: Record<TaskSortField, string> = {
  createdAt: 'created_at',
  title: 'title',
  dueDate: 'due_date',
  priority: 'priority',
};
