/**
 * Tool Executor Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T009
 *
 * Executes backend API calls based on analyzed intent.
 * Handles CRUD operations for tasks via the Phase II FastAPI backend.
 */

import {
  AgentContext,
  AgentResult,
  ToolExecutorOutput,
  TaskOperationResult,
  Task,
  ChatIntent,
} from './types';

/**
 * Executes the appropriate backend API call based on intent
 */
export async function executeIntent(
  context: AgentContext,
  intent: ChatIntent
): Promise<AgentResult<ToolExecutorOutput>> {
  try {
    let result: TaskOperationResult;
    let action: string;

    switch (intent.intent) {
      case 'add_task':
        action = 'create';
        result = await createTask(context, intent);
        break;

      case 'list_tasks':
        action = 'list';
        result = await getTasks(context, intent);
        break;

      case 'complete_task':
        action = 'complete';
        result = await completeTask(context, intent);
        break;

      case 'update_task':
        action = 'update';
        result = await updateTask(context, intent);
        break;

      case 'delete_task':
        action = 'delete';
        result = await deleteTask(context, intent);
        break;

      case 'set_due_date':
        action = 'set_due_date';
        result = await setDueDate(context, intent);
        break;

      case 'get_task_dates':
        action = 'get_dates';
        result = await getTaskDates(context, intent);
        break;

      default:
        return {
          success: false,
          error: {
            code: 'unsupported_intent',
            message: 'This action is not supported.',
          },
        };
    }

    return {
      success: true,
      data: {
        action,
        result,
      },
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      return {
        success: false,
        error: error as { code: string; message: string },
      };
    }

    return {
      success: false,
      error: {
        code: 'execution_failed',
        message: 'Failed to execute the action. Please try again.',
      },
    };
  }
}

/**
 * Makes an authenticated request to the backend API
 */
async function backendRequest<T>(
  context: AgentContext,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${context.backendUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${context.jwt}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw {
        code: 'auth_expired',
        message: 'Your session has expired. Please sign in again.',
      };
    }

    if (response.status === 404) {
      throw {
        code: 'task_not_found',
        message: 'Task not found. It may have been deleted.',
      };
    }

    if (response.status >= 500) {
      throw {
        code: 'backend_error',
        message: 'The task service is temporarily unavailable.',
      };
    }

    const errorData = await response.json().catch(() => ({}));
    throw {
      code: 'backend_error',
      message: errorData.detail || 'An error occurred with the task service.',
    };
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Creates a new task (POST /api/{user_id}/tasks)
 */
async function createTask(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  if (!intent.entities.title) {
    throw {
      code: 'missing_title',
      message: 'Please specify what task you want to add.',
    };
  }

  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: intent.entities.title,
        description: intent.entities.description || '',
      }),
    }
  );

  return {
    task,
    message: `Created task "${task.title}"`,
  };
}

/**
 * Gets tasks with optional filtering (GET /api/{user_id}/tasks)
 */
async function getTasks(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const params = new URLSearchParams();

  // Apply status filter
  if (intent.entities.status_filter === 'pending') {
    params.set('is_completed', 'false');
  } else if (intent.entities.status_filter === 'completed') {
    params.set('is_completed', 'true');
  }

  const queryString = params.toString();
  const endpoint = `/api/${context.userId}/tasks${queryString ? `?${queryString}` : ''}`;

  const tasks = await backendRequest<Task[]>(context, endpoint, {
    method: 'GET',
  });

  return {
    tasks,
    message:
      tasks.length > 0
        ? `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}`
        : 'No tasks found',
  };
}

/**
 * Marks a task as complete (PUT /api/{user_id}/tasks/{id})
 */
async function completeTask(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const taskId = await resolveTaskId(context, intent);

  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        is_completed: true,
      }),
    }
  );

  return {
    task,
    message: `Marked "${task.title}" as complete`,
  };
}

/**
 * Updates a task's title or description (PUT /api/{user_id}/tasks/{id})
 */
async function updateTask(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const taskId = await resolveTaskId(context, intent);

  const updateData: Record<string, string> = {};
  if (intent.entities.title) {
    updateData.title = intent.entities.title;
  }
  if (intent.entities.description) {
    updateData.description = intent.entities.description;
  }

  if (Object.keys(updateData).length === 0) {
    throw {
      code: 'missing_update',
      message: 'Please specify what you want to update (title or description).',
    };
  }

  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }
  );

  return {
    task,
    message: `Updated task "${task.title}"`,
  };
}

/**
 * Deletes a task (DELETE /api/{user_id}/tasks/{id})
 */
async function deleteTask(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const taskId = await resolveTaskId(context, intent);

  // Get task title before deleting for the message
  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'GET',
    }
  );

  await backendRequest<void>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'DELETE',
    }
  );

  return {
    deleted: true,
    task,
    message: `Deleted task "${task.title}"`,
  };
}

/**
 * Sets a due date on a task (PUT /api/{user_id}/tasks/{id})
 */
async function setDueDate(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const taskId = await resolveTaskId(context, intent);

  if (!intent.entities.due_date) {
    throw {
      code: 'missing_date',
      message: 'Please specify when the task is due.',
    };
  }

  // Parse relative dates
  const dueDate = parseRelativeDate(intent.entities.due_date);

  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        due_date: dueDate,
      }),
    }
  );

  return {
    task,
    message: `Set due date for "${task.title}" to ${formatDate(dueDate)}`,
  };
}

/**
 * Gets task dates (GET /api/{user_id}/tasks/{id})
 */
async function getTaskDates(
  context: AgentContext,
  intent: ChatIntent
): Promise<TaskOperationResult> {
  const taskId = await resolveTaskId(context, intent);

  const task = await backendRequest<Task>(
    context,
    `/api/${context.userId}/tasks/${taskId}`,
    {
      method: 'GET',
    }
  );

  return {
    task,
    message: task.due_date
      ? `"${task.title}" is due ${formatDate(task.due_date)}`
      : `"${task.title}" has no due date set`,
  };
}

/**
 * Resolves task ID from intent entities or by searching by title
 */
async function resolveTaskId(
  context: AgentContext,
  intent: ChatIntent
): Promise<number> {
  // Direct task ID reference
  if (intent.entities.task_id !== null) {
    return intent.entities.task_id;
  }

  // Search by title
  if (intent.entities.title) {
    const tasks = await backendRequest<Task[]>(
      context,
      `/api/${context.userId}/tasks`,
      { method: 'GET' }
    );

    const searchTitle = intent.entities.title.toLowerCase();
    const matches = tasks.filter((t) =>
      t.title.toLowerCase().includes(searchTitle)
    );

    if (matches.length === 0) {
      throw {
        code: 'task_not_found',
        message: `No task found matching "${intent.entities.title}"`,
      };
    }

    if (matches.length > 1) {
      const taskList = matches
        .slice(0, 3)
        .map((t) => `#${t.id}: ${t.title}`)
        .join(', ');
      throw {
        code: 'ambiguous_task',
        message: `Multiple tasks match. Please specify by ID: ${taskList}`,
      };
    }

    return matches[0].id;
  }

  throw {
    code: 'missing_task_reference',
    message: 'Please specify which task (by ID or name).',
  };
}

/**
 * Parses relative date strings into ISO format
 */
function parseRelativeDate(dateStr: string): string {
  const lower = dateStr.toLowerCase().trim();
  const today = new Date();

  // Handle relative dates
  if (lower === 'today') {
    return formatDateISO(today);
  }

  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateISO(tomorrow);
  }

  if (lower === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDateISO(nextWeek);
  }

  // Handle day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const targetDay = new Date(today);
    const currentDay = today.getDay();
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    targetDay.setDate(targetDay.getDate() + daysUntil);
    return formatDateISO(targetDay);
  }

  // Try to parse as ISO date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }

  // Return as-is if we can't parse it
  return dateStr;
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
