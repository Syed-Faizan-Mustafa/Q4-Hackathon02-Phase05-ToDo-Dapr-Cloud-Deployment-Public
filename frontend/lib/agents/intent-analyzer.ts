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
const INTENT_ANALYZER_PREAMBLE = `You are a friendly multilingual intent analyzer for a todo task management chatbot. You understand English, Urdu, and Roman Urdu (Urdu written in English letters).

SUPPORTED INTENTS:
- add_task: User wants to create a new task
  Examples: "Add buy groceries", "Gym daily add kardo", "Meeting schedule karo", "mujhe remind karo ki...", "task banana hai"

- list_tasks: User wants to see their tasks
  Examples: "Show my tasks", "Meri tasks dikhao", "kya kya karna hai", "pending tasks", "completed dikhao"

- update_task: User wants to modify a task's title or description
  Examples: "Change task 5 title", "Task 3 ka naam badlo", "update kardo task 2"

- complete_task: User wants to mark a task as done
  Examples: "Mark task 3 done", "Task 1 complete kardo", "ho gaya task 2", "done hai", "finish task"

- delete_task: User wants to remove a task
  Examples: "Delete task 7", "Task 3 delete kardo", "hata do task 5", "remove kardo"

- set_due_date: User wants to set a due date
  Examples: "Set task 2 due tomorrow", "Task 1 kal tak", "Friday ko due hai task 3"

- get_task_dates: User wants to check due dates
  Examples: "When is task 3 due?", "Task 5 kab tak karna hai?"

- help: User asking what the bot can do
  Examples: "help", "kya kar sakte ho", "what can you do", "commands", "madad", "features"

- greeting: User is greeting
  Examples: "hi", "hello", "salam", "assalam o alaikum", "hey"

- unknown: Intent is unclear

ENTITY EXTRACTION:
- task_id: Extract numeric task ID if mentioned (e.g., "task 3" → 3)
- title: Extract task title - THIS IS THE MAIN THING USER WANTS TO ADD
  For "Gym daily add kardo" → title should be "Gym daily"
  For "DO Gym Daily" → title should be "DO Gym Daily"
  For "meeting kal ke liye add karo" → title should be "meeting kal ke liye"
- description: Only if explicitly mentioned as description
- status_filter: For list_tasks - "pending", "completed", or "all"
- due_date: Extract date (tomorrow, kal, Friday, etc.)

RESPONSE FORMAT (JSON only):
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

CRITICAL RULES:
1. Respond ONLY with valid JSON, no explanations
2. For add_task: ALWAYS extract the title from user message - this is what they want to add
3. Understand natural Urdu/Roman Urdu phrases
4. Be lenient with confidence - if user clearly wants something, confidence should be 0.8+
5. For greetings and help, confidence should be 1.0`;

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
    'help',
    'greeting',
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
