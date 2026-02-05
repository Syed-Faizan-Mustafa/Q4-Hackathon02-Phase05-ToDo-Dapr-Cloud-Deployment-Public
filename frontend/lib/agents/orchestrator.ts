/**
 * Todo Orchestrator Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T007
 *
 * Main orchestration agent that coordinates the intent analyzer,
 * tool executor, and response composer agents.
 */

import { analyzeIntent, isConfidentIntent } from './intent-analyzer';
import { executeIntent } from './tool-executor';
import { composeResponse, composeErrorResponse } from './response-composer';
import {
  AgentContext,
  OrchestratorOutput,
  ChatError,
  MIN_CONFIDENCE_THRESHOLD,
  REQUEST_TIMEOUT_MS,
} from './types';

/**
 * Main orchestration function that processes a user message
 * through the agent pipeline.
 */
export async function orchestrate(
  context: AgentContext
): Promise<OrchestratorOutput> {
  try {
    // Step 1: Analyze intent
    const intentResult = await withTimeout(
      analyzeIntent(context),
      REQUEST_TIMEOUT_MS,
      'Intent analysis timed out'
    );

    if (!intentResult.success || !intentResult.data) {
      return {
        response: "I'm having trouble understanding your request. Please try again.",
        error: createError('llm_unavailable', intentResult.error?.message || 'Intent analysis failed'),
      };
    }

    const { intent } = intentResult.data;

    // Step 2: Check intent confidence
    if (!isConfidentIntent(intent) || intent.intent === 'unknown') {
      const errorResponse = composeErrorResponse('intent_unclear', '');
      return {
        response: errorResponse.response,
        intent,
        error: createError('intent_unclear', 'Could not determine intent'),
      };
    }

    // Step 3: Execute the intent via tool executor
    const executionResult = await withTimeout(
      executeIntent(context, intent),
      REQUEST_TIMEOUT_MS,
      'Task operation timed out'
    );

    if (!executionResult.success || !executionResult.data) {
      const errorCode = executionResult.error?.code || 'backend_error';
      const errorMessage = executionResult.error?.message || 'Failed to execute action';
      const errorResponse = composeErrorResponse(errorCode, errorMessage);
      return {
        response: errorResponse.response,
        intent,
        error: createError(mapErrorCode(errorCode), errorMessage),
      };
    }

    // Step 4: Compose user-friendly response
    const responseResult = await composeResponse(
      context,
      intent,
      executionResult.data
    );

    if (!responseResult.success || !responseResult.data) {
      // Fallback to tool result message
      return {
        response: executionResult.data.result.message || 'Done!',
        intent,
      };
    }

    return {
      response: responseResult.data.response,
      intent,
    };
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timed out')) {
      return {
        response: 'The request took too long. Please try again.',
        error: createError('timeout', error.message, true),
      };
    }

    // Handle ChatError objects
    if (isChatError(error)) {
      const errorResponse = composeErrorResponse(error.type, error.message);
      return {
        response: errorResponse.response,
        error,
      };
    }

    // Generic error fallback
    return {
      response: 'Something went wrong. Please try again.',
      error: createError('backend_error', 'An unexpected error occurred', true),
    };
  }
}

/**
 * Wraps a promise with a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Creates a ChatError object
 */
function createError(
  type: ChatError['type'],
  message: string,
  retryable: boolean = false,
  retryAfter?: number
): ChatError {
  const error: ChatError = {
    type,
    message,
    retryable,
  };

  if (retryAfter !== undefined) {
    error.retryAfter = retryAfter;
  }

  return error;
}

/**
 * Maps internal error codes to ChatError types
 */
function mapErrorCode(code: string): ChatError['type'] {
  const mapping: Record<string, ChatError['type']> = {
    task_not_found: 'task_not_found',
    auth_expired: 'auth_expired',
    backend_error: 'backend_error',
    rate_limit: 'rate_limit',
    timeout: 'timeout',
    network: 'network',
    llm_unavailable: 'llm_unavailable',
    intent_unclear: 'intent_unclear',
    ambiguous_task: 'task_not_found',
    missing_title: 'intent_unclear',
    missing_task_reference: 'intent_unclear',
    missing_update: 'intent_unclear',
    missing_date: 'intent_unclear',
    unsupported_intent: 'intent_unclear',
  };

  return mapping[code] || 'backend_error';
}

/**
 * Type guard to check if an error is a ChatError
 */
function isChatError(error: unknown): error is ChatError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'retryable' in error
  );
}
