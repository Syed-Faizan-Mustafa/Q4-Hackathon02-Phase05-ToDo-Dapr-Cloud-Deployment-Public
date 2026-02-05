/**
 * Intent Analyzer Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T008
 *
 * Analyzes user messages to determine intent and extract entities.
 * Uses Cohere API with a structured prompt template.
 */

import { cohereChat } from './cohere-adapter';
import {
  AgentContext,
  AgentResult,
  IntentAnalyzerOutput,
  ChatIntent,
  IntentType,
  IntentEntities,
  MIN_CONFIDENCE_THRESHOLD,
  INTENT_ANALYZER_TEMPERATURE,
} from './types';

/**
 * System prompt for intent analysis
 */
const INTENT_ANALYZER_PREAMBLE = `You are an intent analyzer for a todo task management chatbot. Your job is to analyze user messages and determine their intent.

SUPPORTED INTENTS:
- add_task: User wants to create a new task (e.g., "Add buy groceries", "Create task: finish report")
- list_tasks: User wants to see their tasks (e.g., "Show my tasks", "What tasks are pending?", "List all tasks")
- update_task: User wants to modify a task's title or description (e.g., "Change task 5 title to...", "Update description of task 3")
- complete_task: User wants to mark a task as done (e.g., "Mark task 3 done", "Complete buy groceries", "Finish task 2")
- delete_task: User wants to remove a task (e.g., "Delete task 7", "Remove finish report")
- set_due_date: User wants to set a due date (e.g., "Set task 2 due tomorrow", "Task 3 due on Friday")
- get_task_dates: User wants to check due dates (e.g., "When is task 3 due?", "What's the deadline for task 5?")
- unknown: Intent is unclear or not supported

ENTITY EXTRACTION:
- task_id: Extract numeric task ID if mentioned (e.g., "task 3" → 3)
- title: Extract task title for add/update operations
- description: Extract description if explicitly mentioned
- status_filter: For list_tasks - "pending", "completed", or "all"
- due_date: Extract date in ISO format (YYYY-MM-DD) or relative terms like "tomorrow", "next week"

RESPONSE FORMAT (JSON only, no other text):
{
  "intent": "<intent_type>",
  "entities": {
    "task_id": <number or null>,
    "title": "<string or null>",
    "description": "<string or null>",
    "status_filter": "<pending|completed|all or null>",
    "due_date": "<date string or null>"
  },
  "confidence": <0.0 to 1.0>
}

IMPORTANT:
- Respond ONLY with valid JSON, no explanations
- Set confidence between 0.0 and 1.0 based on how clear the intent is
- If multiple tasks could match a name, still identify the intent but note low confidence
- For ambiguous messages, use "unknown" intent with low confidence`;

/**
 * Analyzes a user message to determine intent and extract entities
 */
export async function analyzeIntent(
  context: AgentContext
): Promise<AgentResult<IntentAnalyzerOutput>> {
  try {
    const userPrompt = `Analyze this user message and respond with JSON only:\n\n"${context.message}"`;

    const response = await cohereChat(userPrompt, INTENT_ANALYZER_PREAMBLE, {
      temperature: INTENT_ANALYZER_TEMPERATURE,
      maxTokens: 256,
    });

    // Parse the JSON response
    const parsedIntent = parseIntentResponse(response.text, context.message);

    return {
      success: true,
      data: {
        intent: parsedIntent,
      },
    };
  } catch (error) {
    // If it's a ChatError, propagate it
    if (error && typeof error === 'object' && 'type' in error) {
      const err = error as unknown as { type: string; message?: string };
      return {
        success: false,
        error: {
          code: err.type,
          message: err.message || 'An error occurred during intent analysis.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'intent_analysis_failed',
        message: 'Failed to analyze your message. Please try rephrasing.',
      },
    };
  }
}

/**
 * Parses the LLM response into a ChatIntent object
 */
function parseIntentResponse(responseText: string, rawMessage: string): ChatIntent {
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    const intent = normalizeIntent(parsed.intent);
    const entities = normalizeEntities(parsed.entities || {});
    const confidence = normalizeConfidence(parsed.confidence);

    return {
      intent,
      entities,
      confidence,
      raw_message: rawMessage,
    };
  } catch {
    // If parsing fails, return unknown intent
    return {
      intent: 'unknown',
      entities: createEmptyEntities(),
      confidence: 0.3,
      raw_message: rawMessage,
    };
  }
}

/**
 * Normalizes intent type to valid enum value
 */
function normalizeIntent(intent: unknown): IntentType {
  const validIntents: IntentType[] = [
    'add_task',
    'list_tasks',
    'update_task',
    'complete_task',
    'delete_task',
    'set_due_date',
    'get_task_dates',
    'unknown',
  ];

  if (typeof intent === 'string' && validIntents.includes(intent as IntentType)) {
    return intent as IntentType;
  }

  return 'unknown';
}

/**
 * Normalizes entities object
 */
function normalizeEntities(entities: Record<string, unknown>): IntentEntities {
  return {
    task_id: typeof entities.task_id === 'number' ? entities.task_id : null,
    title: typeof entities.title === 'string' ? entities.title : null,
    description: typeof entities.description === 'string' ? entities.description : null,
    status_filter: normalizeStatusFilter(entities.status_filter),
    due_date: typeof entities.due_date === 'string' ? entities.due_date : null,
  };
}

/**
 * Normalizes status filter value
 */
function normalizeStatusFilter(
  filter: unknown
): 'pending' | 'completed' | 'all' | null {
  if (filter === 'pending' || filter === 'completed' || filter === 'all') {
    return filter;
  }
  return null;
}

/**
 * Normalizes confidence value to 0-1 range
 */
function normalizeConfidence(confidence: unknown): number {
  if (typeof confidence === 'number' && !isNaN(confidence)) {
    return Math.max(0, Math.min(1, confidence));
  }
  return 0.5;
}

/**
 * Creates empty entities object
 */
function createEmptyEntities(): IntentEntities {
  return {
    task_id: null,
    title: null,
    description: null,
    status_filter: null,
    due_date: null,
  };
}

/**
 * Checks if the intent confidence meets the minimum threshold
 */
export function isConfidentIntent(intent: ChatIntent): boolean {
  return intent.confidence >= MIN_CONFIDENCE_THRESHOLD;
}
