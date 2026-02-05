/**
 * AI Todo Chatbot - Shared Types
 * Feature: 003-ai-todo-chatbot
 */

// =============================================================================
// Core Entities
// =============================================================================

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export type IntentType =
  | 'add_task'
  | 'list_tasks'
  | 'update_task'
  | 'complete_task'
  | 'delete_task'
  | 'set_due_date'
  | 'get_task_dates'
  | 'unknown';

export interface IntentEntities {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status_filter: 'pending' | 'completed' | 'all' | null;
  due_date: string | null;
}

export interface ChatIntent {
  intent: IntentType;
  entities: IntentEntities;
  confidence: number;
  raw_message: string;
}

export interface ChatSession {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  cooldownUntil: number | null;
}

// =============================================================================
// Error Types
// =============================================================================

export type ChatErrorType =
  | 'network'
  | 'rate_limit'
  | 'llm_unavailable'
  | 'backend_error'
  | 'auth_expired'
  | 'intent_unclear'
  | 'task_not_found'
  | 'timeout';

export interface ChatError {
  type: ChatErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

// =============================================================================
// Agent Types
// =============================================================================

export interface AgentContext {
  userId: string;
  jwt: string;
  message: string;
  backendUrl: string;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface IntentAnalyzerOutput {
  intent: ChatIntent;
}

export interface ToolExecutorOutput {
  action: string;
  result: TaskOperationResult;
}

export interface TaskOperationResult {
  tasks?: Task[];
  task?: Task;
  deleted?: boolean;
  message?: string;
}

// Task type from Phase II backend
export interface Task {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface ResponseComposerOutput {
  response: string;
  suggestedActions?: string[];
}

export interface OrchestratorOutput {
  response: string;
  intent?: ChatIntent;
  error?: ChatError;
}

// =============================================================================
// API Types
// =============================================================================

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: {
    type: ChatErrorType;
    message: string;
    retryable: boolean;
    retryAfter?: number;
  };
}

// =============================================================================
// Cohere API Types
// =============================================================================

export interface CohereChatRequest {
  model: string;
  message: string;
  preamble?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface CohereChatResponse {
  text: string;
  generation_id: string;
  finish_reason: string;
}

export interface CohereErrorResponse {
  message: string;
  status_code?: number;
}

// =============================================================================
// Constants
// =============================================================================

export const MIN_CONFIDENCE_THRESHOLD = 0.7;
export const RATE_LIMIT_COOLDOWN_SECONDS = 30;
export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_TASKS_DISPLAY = 10;
export const INTENT_ANALYZER_TEMPERATURE = 0.3;
export const RESPONSE_COMPOSER_TEMPERATURE = 0.7;
export const COHERE_MODEL = 'command-r-plus';

// Welcome message displayed when chat first opens
export const WELCOME_MESSAGE = "Hi! I can help you manage your tasks. Try saying:\n• \"Add buy groceries\"\n• \"Show my tasks\"\n• \"Mark task 1 done\"";
