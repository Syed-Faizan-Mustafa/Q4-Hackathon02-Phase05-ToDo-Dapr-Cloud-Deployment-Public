/**
 * Chat API Route
 * Feature: 003-ai-todo-chatbot
 * Task: T011
 *
 * Server-side API endpoint that processes chat messages through the
 * orchestrator agent. Protects Cohere API key and handles authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { orchestrate } from '@/lib/agents/orchestrator';
import { validateCohereConfig } from '@/lib/agents/cohere-adapter';
import {
  ChatRequest,
  ChatResponse,
  MAX_MESSAGE_LENGTH,
} from '@/lib/agents/types';

// Use BACKEND_URL for server-side API calls (Hugging Face backend)
const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper to get session using Better Auth's API
 */
async function getSession(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * POST /api/chat - Process a chat message
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    // Validate Cohere API configuration
    if (!validateCohereConfig()) {
      console.error('Cohere API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'llm_unavailable',
            message: 'AI service is not configured. Please contact support.',
            retryable: false,
          },
        },
        { status: 503 }
      );
    }

    // Authenticate the request
    const session = await getSession(request);

    if (!session?.session?.token || !session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'auth_expired',
            message: 'Your session has expired. Please sign in again.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'backend_error',
            message: 'Invalid request format.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'backend_error',
            message: 'Message is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (message.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'backend_error',
            message: 'Message cannot be empty.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'backend_error',
            message: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Build agent context
    const context = {
      userId: session.user.id,
      jwt: session.session.token,
      message,
      backendUrl: API_BASE_URL,
    };

    // Process through orchestrator
    const result = await orchestrate(context);

    // Return response
    if (result.error) {
      return NextResponse.json({
        success: false,
        response: result.response,
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      response: result.response,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'backend_error',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
