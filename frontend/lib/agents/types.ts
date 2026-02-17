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
  | 'incomplete_task'
  | 'delete_task'
  | 'set_due_date'
  | 'get_task_dates'
  | 'set_priority'
  | 'add_tags'
  | 'search_tasks'
  | 'set_recurring'
  | 'help'
  | 'greeting'
  | 'unknown';

export interface IntentEntities {
  task_id: string | null;  // Backend uses UUID for task IDs
  title: string | null;
  description: string | null;
  status_filter: 'pending' | 'completed' | 'all' | null;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  tags: string[] | null;
  search: string | null;
  ordinal: number | null;  // 1=newest, 2=second newest, etc.
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

// Task type from backend - Phase 5 enhanced with priority, tags, due_date, recurrence
export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  due_date: string | null;
  remind_at: string | null;
  reminder_sent: boolean;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_interval: number;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
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
export const COHERE_MODEL = 'command-a-03-2025';

// Welcome message displayed when chat first opens (Bilingual: English + Urdu)
export const WELCOME_MESSAGE = `Hello! I'm your Todo Assistant / Assalam o Alaikum! Main aapka Todo Assistant hoon.

I can help you with / Main yeh kaam kar sakta hoon:
• Add tasks - "Add buy groceries with high priority" / "Gym task add kardo"
• Show tasks - "Show my tasks" / "Show high priority tasks"
• Complete tasks - "Complete buy groceries" / "Task complete kardo"
• Update tasks - "Update my first task" / "Set priority high for task"
• Delete tasks - "Delete gym task" / "Gym wala task delete kardo"
• Set due dates - "Set task due tomorrow" / "Task kal tak kardo"

Just tell me what you need! / Bas mujhe batao kya karna hai!`;

// Help message when user asks for capabilities (Bilingual)
export const HELP_MESSAGE = `I can help you manage your tasks / Main aapki madad kar sakta hoon:

📝 **Add Task:** "Add buy groceries with high priority", "Add task #work #urgent"
📋 **View Tasks:** "Show my tasks", "Show high priority", "Search meeting"
✅ **Complete Task:** "Complete grocery shopping", "Mark meeting done"
✏️ **Update Task:** "Update my first task", "Set priority high for task"
📅 **Due Dates:** "Set task due tomorrow", "Show overdue tasks"
🗑️ **Delete Task:** "Delete gym task", "Remove meeting task"

Features: priorities (high/medium/low), tags (#work, #personal), due dates, search, and more!

English, Urdu ya dono mila kar baat kar sakte ho!`;
