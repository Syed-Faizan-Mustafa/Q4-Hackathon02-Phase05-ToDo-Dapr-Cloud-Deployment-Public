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
 * System prompt for response composition (Bilingual: English + Urdu)
 */
const RESPONSE_COMPOSER_PREAMBLE = `You are a friendly, helpful bilingual assistant for a todo task management app. Your job is to compose natural, conversational responses in BOTH English AND Urdu (Roman Urdu).

GUIDELINES:
- Be concise but friendly (1-3 sentences max)
- ALWAYS provide response in BOTH languages: English first, then Urdu
- Use casual, supportive language
- Include relevant details from the action result
- Never be verbose or overly formal

RESPONSE FORMAT (always use this pattern):
"English message / Urdu message"

RESPONSE EXAMPLES:

Task creation:
"Great! '[task title]' has been added. ✓ / Zabardast! '[task title]' add ho gaya. ✓"

Task listing:
"Here are your tasks / Yeh rahi aapki tasks:
1. [title] [✓ if completed]
2. [title]
..."

Task completion:
"Congratulations! '[task title]' is complete. ✓ / Mubarak! '[task title]' complete ho gaya. ✓"

Task updates:
"Done! '[task title]' has been updated. / Done! '[task title]' update ho gaya."

Task deletion:
"Okay! '[task title]' has been deleted. / Theek hai! '[task title]' delete ho gaya."

Due dates:
"Set! '[task title]' is due [date]. / Set! '[task title]' [date] tak due hai."

IMPORTANT:
- Keep responses SHORT and friendly
- Use ✓ for confirmations
- ALWAYS include BOTH English AND Urdu
- Never mention technical details`;

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
          response: `Great! "${result.task.title}" has been added. ✓ / Zabardast! "${result.task.title}" add ho gaya. ✓`,
          suggestedActions: ['Show my tasks / Meri tasks dikhao', 'Add more / Aur add karo'],
        };
      }
      break;

    case 'complete':
      if (result.task) {
        return {
          response: `Congratulations! "${result.task.title}" is complete. ✓ / Mubarak! "${result.task.title}" complete ho gaya. ✓`,
          suggestedActions: ['Show pending / Pending dikhao', 'Show completed / Completed dikhao'],
        };
      }
      break;

    case 'delete':
      if (result.task) {
        return {
          response: `Okay! "${result.task.title}" has been deleted. / Theek hai! "${result.task.title}" delete ho gaya.`,
          suggestedActions: ['Show my tasks / Meri tasks dikhao'],
        };
      }
      break;

    case 'update':
      if (result.task) {
        return {
          response: `Done! "${result.task.title}" has been updated. ✓ / Done! "${result.task.title}" update ho gaya. ✓`,
          suggestedActions: ['Show my tasks / Meri tasks dikhao'],
        };
      }
      break;

    case 'set_due_date':
    case 'get_dates':
      // Due dates are not supported in the current backend API
      return {
        response: `Due dates feature is not available. / Due date feature abhi available nahi hai.`,
        suggestedActions: ['Show my tasks / Meri tasks dikhao'],
      };

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
        response: "Awesome! No pending tasks. All done! 🎉 / Waah! Koi pending task nahi hai. Sab kaam ho gaya! 🎉",
        suggestedActions: ['Add task / Task add karo', 'Show completed / Completed dikhao'],
      };
    } else if (filter === 'completed') {
      return {
        response: "No tasks completed yet. Let's get some work done! / Abhi tak koi task complete nahi hua. Chalo kuch kaam karte hain!",
        suggestedActions: ['Show pending / Pending dikhao', 'Add task / Task add karo'],
      };
    }
    return {
      response: "Your task list is empty. Let's add some tasks! / Aapki task list khaali hai. Chalo kuch tasks add karte hain!",
      suggestedActions: ['Add task / Task add karo'],
    };
  }

  const filter = intent.entities.status_filter;
  const filterLabel =
    filter === 'pending'
      ? 'pending'
      : filter === 'completed'
        ? 'completed'
        : 'all / sari';

  // Limit displayed tasks
  const displayTasks = tasks.slice(0, MAX_TASKS_DISPLAY);
  const hasMore = tasks.length > MAX_TASKS_DISPLAY;

  let response = `Here are your ${filterLabel} tasks / Yeh rahi aapki ${filterLabel} tasks:\n`;

  displayTasks.forEach((task, index) => {
    const status = task.completed ? '✓' : '○';
    // Note: Backend does not support due_date field
    // Use index+1 for display since task IDs are UUIDs
    response += `${index + 1}. ${status} ${task.title}\n`;
  });

  if (hasMore) {
    response += `\n...and ${tasks.length - MAX_TASKS_DISPLAY} more. / ...aur ${tasks.length - MAX_TASKS_DISPLAY} zyada hain.`;
  }

  return {
    response: response.trim(),
    suggestedActions: ['Complete task / Task complete karo', 'Add task / Task add karo'],
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

  // Generic fallback (bilingual)
  return {
    response: 'Done! Your request has been processed. / Ho gaya! Aapki request process ho gayi.',
    suggestedActions: ['Show my tasks / Meri tasks dikhao'],
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
 * Composes an error response (Bilingual: English + Urdu)
 */
export function composeErrorResponse(
  errorCode: string,
  errorMessage: string
): ResponseComposerOutput {
  switch (errorCode) {
    case 'task_not_found':
      return {
        response: "Task not found. It may have been deleted. Try 'show my tasks' to see what's available. / Yeh task nahi mila. Shayad delete ho gaya. 'meri tasks dikhao' bol kar dekho kya available hai.",
        suggestedActions: ['Show my tasks / Meri tasks dikhao'],
      };

    case 'ambiguous_task':
      return {
        response: errorMessage,
        suggestedActions: ['Show my tasks / Meri tasks dikhao'],
      };

    case 'auth_expired':
      return {
        response: 'Your session has expired. Please refresh the page and login again. / Aapka session expire ho gaya. Please page refresh karke dobara login karo.',
        suggestedActions: [],
      };

    case 'backend_error':
      return {
        response: "Connection issue. Please try again later. / Abhi connection mein problem hai. Thodi der baad try karo.",
        suggestedActions: ['Try again / Dobara try karo'],
      };

    case 'rate_limit':
      return {
        response: "Too many requests. Please wait a moment and try again. / Bohat zyada requests aa rahi hain. Thoda ruko phir try karo.",
        suggestedActions: [],
      };

    case 'intent_unclear':
      return {
        response: "I didn't understand. Try saying:\n• 'Add gym daily' / 'Gym daily add karo'\n• 'Show my tasks' / 'Meri tasks dikhao'\n• 'Complete task 1' / 'Task 1 complete karo'\n\nType 'help' to see what I can do. / 'help' likh kar dekho main kya kya kar sakta hoon.",
        suggestedActions: ['Add task / Task add karo', 'Show tasks / Tasks dikhao', 'help'],
      };

    default:
      return {
        response: 'Something went wrong. Please try again. / Kuch gadbad ho gayi. Dobara try karo.',
        suggestedActions: ['Try again / Dobara try karo'],
      };
  }
}

/**
 * Formats a date string for display
 * Handles various date formats and returns a user-friendly string
 */
function formatDisplayDate(dateStr: string): string {
  try {
    // Handle null, undefined, or empty strings
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
      return 'no date set';
    }

    const date = new Date(dateStr);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      // Try parsing as ISO string without timezone
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsedDate.getTime())) {
          return formatValidDate(parsedDate);
        }
      }
      // Return original string if parsing fails
      return dateStr;
    }

    return formatValidDate(date);
  } catch {
    return dateStr || 'no date';
  }
}

/**
 * Formats a valid Date object for display
 */
function formatValidDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time parts for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  // Check if it's today or tomorrow
  if (compareDate.getTime() === today.getTime()) {
    return 'today / aaj';
  }
  if (compareDate.getTime() === tomorrow.getTime()) {
    return 'tomorrow / kal';
  }

  // Otherwise, format nicely
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
