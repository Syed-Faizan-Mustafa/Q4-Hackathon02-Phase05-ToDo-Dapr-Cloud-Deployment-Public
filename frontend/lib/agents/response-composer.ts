/**
 * Response Composer Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T010
 *
 * Generates user-friendly, conversational responses based on tool execution results.
 * Uses Cohere API for natural language generation.
 */

import { cohereChat } from './cohere-adapter';
import {
  AgentContext,
  AgentResult,
  ResponseComposerOutput,
  ToolExecutorOutput,
  ChatIntent,
  Task,
  RESPONSE_COMPOSER_TEMPERATURE,
  MAX_TASKS_DISPLAY,
} from './types';

/**
 * System prompt for response composition
 */
const RESPONSE_COMPOSER_PREAMBLE = `You are a friendly, helpful assistant for a todo task management app. Your job is to compose natural, conversational responses to users.

GUIDELINES:
- Be concise but friendly (1-3 sentences max)
- Use casual, supportive language
- Include relevant details from the action result
- For task lists, format them clearly with numbers and status indicators
- Offer helpful follow-up suggestions when appropriate
- Never be verbose or overly formal

RESPONSE FORMATS:

For task creation:
"Got it! I've added '[task title]' to your list. ✓"

For task listing:
"Here are your [pending/completed/all] tasks:
1. [title] [✓ if completed]
2. [title]
..."

For task completion:
"Nice work! '[task title]' is marked as done. ✓"

For task updates:
"Updated! '[task title]' has been changed."

For task deletion:
"Done! I've removed '[task title]' from your list."

For due dates:
"Set! '[task title]' is due [date]."

For errors:
Be apologetic but helpful, suggest what the user can try instead.

IMPORTANT:
- Keep responses SHORT and natural
- Use ✓ sparingly for confirmations
- Never mention technical details or APIs
- If suggesting actions, keep them simple`;

/**
 * Composes a user-friendly response based on the tool execution result
 */
export async function composeResponse(
  context: AgentContext,
  intent: ChatIntent,
  toolResult: ToolExecutorOutput
): Promise<AgentResult<ResponseComposerOutput>> {
  try {
    // For simple, predictable responses, use templates directly
    const templateResponse = getTemplateResponse(intent, toolResult);
    if (templateResponse) {
      return {
        success: true,
        data: templateResponse,
      };
    }

    // For complex responses, use LLM
    const prompt = buildCompositionPrompt(intent, toolResult);
    const response = await cohereChat(prompt, RESPONSE_COMPOSER_PREAMBLE, {
      temperature: RESPONSE_COMPOSER_TEMPERATURE,
      maxTokens: 256,
    });

    return {
      success: true,
      data: {
        response: response.text.trim(),
        suggestedActions: getSuggestedActions(intent),
      },
    };
  } catch (error) {
    // Fallback to template response
    const fallback = getFallbackResponse(intent, toolResult);
    return {
      success: true,
      data: fallback,
    };
  }
}

/**
 * Gets a template-based response for simple cases
 */
function getTemplateResponse(
  intent: ChatIntent,
  toolResult: ToolExecutorOutput
): ResponseComposerOutput | null {
  const { action, result } = toolResult;

  switch (action) {
    case 'create':
      if (result.task) {
        return {
          response: `Got it! I've added "${result.task.title}" to your list. ✓`,
          suggestedActions: ['Show my tasks', 'Add another task'],
        };
      }
      break;

    case 'complete':
      if (result.task) {
        return {
          response: `Nice work! "${result.task.title}" is marked as done. ✓`,
          suggestedActions: ['Show pending tasks', 'Show completed tasks'],
        };
      }
      break;

    case 'delete':
      if (result.task) {
        return {
          response: `Done! I've removed "${result.task.title}" from your list.`,
          suggestedActions: ['Show my tasks'],
        };
      }
      break;

    case 'update':
      if (result.task) {
        return {
          response: `Updated! "${result.task.title}" has been changed. ✓`,
          suggestedActions: ['Show my tasks'],
        };
      }
      break;

    case 'set_due_date':
      if (result.task && result.task.due_date) {
        const formattedDate = formatDisplayDate(result.task.due_date);
        return {
          response: `Set! "${result.task.title}" is due ${formattedDate}. ✓`,
          suggestedActions: ['Show my tasks', 'What tasks are due?'],
        };
      }
      break;

    case 'get_dates':
      if (result.task) {
        if (result.task.due_date) {
          const formattedDate = formatDisplayDate(result.task.due_date);
          return {
            response: `"${result.task.title}" is due ${formattedDate}.`,
            suggestedActions: ['Show pending tasks'],
          };
        } else {
          return {
            response: `"${result.task.title}" doesn't have a due date set.`,
            suggestedActions: ['Set a due date'],
          };
        }
      }
      break;

    case 'list':
      return formatTaskList(result.tasks || [], intent);
  }

  return null;
}

/**
 * Formats a list of tasks for display
 */
function formatTaskList(
  tasks: Task[],
  intent: ChatIntent
): ResponseComposerOutput {
  if (tasks.length === 0) {
    const filter = intent.entities.status_filter;
    if (filter === 'pending') {
      return {
        response: "You're all caught up! No pending tasks. 🎉",
        suggestedActions: ['Add a task', 'Show completed tasks'],
      };
    } else if (filter === 'completed') {
      return {
        response: "No completed tasks yet. Time to get things done!",
        suggestedActions: ['Show pending tasks', 'Add a task'],
      };
    }
    return {
      response: "Your task list is empty. Let's add some tasks!",
      suggestedActions: ['Add a task'],
    };
  }

  const filter = intent.entities.status_filter;
  const filterLabel =
    filter === 'pending'
      ? 'pending'
      : filter === 'completed'
        ? 'completed'
        : '';

  // Limit displayed tasks
  const displayTasks = tasks.slice(0, MAX_TASKS_DISPLAY);
  const hasMore = tasks.length > MAX_TASKS_DISPLAY;

  let response = `Here are your ${filterLabel} tasks:\n`;

  displayTasks.forEach((task, index) => {
    const status = task.is_completed ? '✓' : '○';
    const dueInfo = task.due_date ? ` (due ${formatDisplayDate(task.due_date)})` : '';
    response += `${index + 1}. ${status} ${task.title}${dueInfo}\n`;
  });

  if (hasMore) {
    response += `\n...and ${tasks.length - MAX_TASKS_DISPLAY} more. Say "show all tasks" to see everything.`;
  }

  return {
    response: response.trim(),
    suggestedActions: ['Mark a task done', 'Add a task'],
  };
}

/**
 * Builds a prompt for the LLM to compose a response
 */
function buildCompositionPrompt(
  intent: ChatIntent,
  toolResult: ToolExecutorOutput
): string {
  return `User wanted to: ${intent.intent.replace('_', ' ')}
Action taken: ${toolResult.action}
Result: ${JSON.stringify(toolResult.result)}

Compose a brief, friendly response (1-2 sentences max):`;
}

/**
 * Gets fallback response when LLM fails
 */
function getFallbackResponse(
  intent: ChatIntent,
  toolResult: ToolExecutorOutput
): ResponseComposerOutput {
  // Use the message from tool result if available
  if (toolResult.result.message) {
    return {
      response: toolResult.result.message,
      suggestedActions: getSuggestedActions(intent),
    };
  }

  // Generic fallback
  return {
    response: 'Done! Your request has been processed.',
    suggestedActions: ['Show my tasks'],
  };
}

/**
 * Gets suggested follow-up actions based on intent
 */
function getSuggestedActions(intent: ChatIntent): string[] {
  switch (intent.intent) {
    case 'add_task':
      return ['Show my tasks', 'Add another task'];
    case 'list_tasks':
      return ['Mark a task done', 'Add a task'];
    case 'complete_task':
      return ['Show pending tasks', 'Show completed tasks'];
    case 'update_task':
      return ['Show my tasks'];
    case 'delete_task':
      return ['Show my tasks', 'Add a task'];
    case 'set_due_date':
    case 'get_task_dates':
      return ['Show my tasks', 'What tasks are due?'];
    default:
      return ['Show my tasks', 'Add a task'];
  }
}

/**
 * Composes an error response
 */
export function composeErrorResponse(
  errorCode: string,
  errorMessage: string
): ResponseComposerOutput {
  switch (errorCode) {
    case 'task_not_found':
      return {
        response: "I couldn't find that task. It may have been deleted. Try \"show my tasks\" to see what's available.",
        suggestedActions: ['Show my tasks'],
      };

    case 'ambiguous_task':
      return {
        response: errorMessage,
        suggestedActions: ['Show my tasks'],
      };

    case 'auth_expired':
      return {
        response: 'Your session has expired. Please refresh the page and sign in again.',
        suggestedActions: [],
      };

    case 'backend_error':
      return {
        response: "I'm having trouble connecting to the task service. Please try again in a moment.",
        suggestedActions: ['Try again'],
      };

    case 'rate_limit':
      return {
        response: "I'm getting too many requests right now. Please wait a moment before trying again.",
        suggestedActions: [],
      };

    case 'intent_unclear':
      return {
        response: "I'm not sure what you'd like me to do. Try saying things like:\n• \"Add buy groceries\"\n• \"Show my tasks\"\n• \"Mark task 1 done\"",
        suggestedActions: ['Add a task', 'Show my tasks'],
      };

    default:
      return {
        response: 'Something went wrong. Please try again.',
        suggestedActions: ['Try again'],
      };
  }
}

/**
 * Formats a date string for display
 */
function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow';
    }

    // Otherwise, format nicely
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
