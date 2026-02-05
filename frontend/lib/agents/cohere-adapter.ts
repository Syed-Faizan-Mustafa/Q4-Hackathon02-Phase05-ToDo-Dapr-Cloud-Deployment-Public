/**
 * Cohere API Adapter
 * Feature: 003-ai-todo-chatbot
 * Task: T005
 *
 * Handles all communication with Cohere API for LLM inference.
 * Implements error handling, rate limiting, and timeout management.
 */

import {
  CohereChatRequest,
  CohereChatResponse,
  CohereErrorResponse,
  ChatError,
  REQUEST_TIMEOUT_MS,
  RATE_LIMIT_COOLDOWN_SECONDS,
  COHERE_MODEL,
} from './types';

const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

/**
 * Makes a chat request to Cohere API
 */
export async function cohereChat(
  message: string,
  preamble: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<CohereChatResponse> {
  const apiKey = process.env.COHERE_API_KEY;

  if (!apiKey) {
    throw createCohereError('llm_unavailable', 'Cohere API key not configured');
  }

  const model = process.env.COHERE_MODEL || COHERE_MODEL;
  const temperature = options?.temperature ?? 0.3;
  const maxTokens = options?.maxTokens ?? 1024;

  const requestBody: CohereChatRequest = {
    model,
    message,
    preamble,
    temperature,
    max_tokens: maxTokens,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    const data = await response.json();

    return {
      text: data.text,
      generation_id: data.generation_id,
      finish_reason: data.finish_reason || 'complete',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw createCohereError(
          'timeout',
          'Request timed out. Please try again.',
          true,
          undefined
        );
      }

      // Network errors
      if (error.message.includes('fetch')) {
        throw createCohereError(
          'network',
          'Unable to connect to AI service. Please check your connection.',
          true
        );
      }
    }

    // Re-throw if it's already a ChatError
    if (isChatError(error)) {
      throw error;
    }

    throw createCohereError(
      'llm_unavailable',
      'AI service is temporarily unavailable. Please try again later.',
      true
    );
  }
}

/**
 * Handles non-OK HTTP responses from Cohere API
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = 'An error occurred with the AI service';
  let errorData: CohereErrorResponse | null = null;

  try {
    errorData = await response.json();
    if (errorData?.message) {
      errorMessage = errorData.message;
    }
  } catch {
    // Ignore JSON parsing errors
  }

  // Rate limiting (429)
  if (response.status === 429) {
    throw createCohereError(
      'rate_limit',
      'Too many requests. Please wait a moment before trying again.',
      true,
      RATE_LIMIT_COOLDOWN_SECONDS
    );
  }

  // Authentication errors (401, 403)
  if (response.status === 401 || response.status === 403) {
    throw createCohereError(
      'llm_unavailable',
      'AI service authentication failed. Please contact support.',
      false
    );
  }

  // Server errors (5xx)
  if (response.status >= 500) {
    throw createCohereError(
      'llm_unavailable',
      'AI service is temporarily unavailable. Please try again later.',
      true
    );
  }

  // Other client errors (4xx)
  throw createCohereError('backend_error', errorMessage, false);
}

/**
 * Creates a standardized ChatError object
 */
function createCohereError(
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

/**
 * Validates that the Cohere API key is configured
 */
export function validateCohereConfig(): boolean {
  return !!process.env.COHERE_API_KEY;
}
