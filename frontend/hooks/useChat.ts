/**
 * useChat Hook - Chat State Management
 * Feature: 003-ai-todo-chatbot
 * Task: T006
 *
 * Manages chat session state including messages, loading, errors, and cooldown.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatSession,
  ChatError,
  ChatResponse,
  WELCOME_MESSAGE,
  RATE_LIMIT_COOLDOWN_SECONDS,
} from '@/lib/agents/types';

interface UseChatReturn {
  // Session state
  session: ChatSession;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

/**
 * Generates a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates the initial welcome message
 */
function createWelcomeMessage(): ChatMessage {
  return {
    id: generateMessageId(),
    sender: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date(),
    status: 'sent',
  };
}

export function useChat(): UseChatReturn {
  const [session, setSession] = useState<ChatSession>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isLoading: false,
    error: null,
    cooldownUntil: null,
  });

  // Track if welcome message has been shown
  const welcomeShownRef = useRef(false);

  // Cooldown timer
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Opens the chat window and shows welcome message if first time
   */
  const openChat = useCallback(() => {
    setSession((prev) => {
      const messages = !welcomeShownRef.current
        ? [createWelcomeMessage()]
        : prev.messages;

      if (!welcomeShownRef.current) {
        welcomeShownRef.current = true;
      }

      return {
        ...prev,
        isOpen: true,
        isMinimized: false,
        messages,
      };
    });
  }, []);

  /**
   * Closes the chat window
   */
  const closeChat = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
    }));
  }, []);

  /**
   * Minimizes the chat window
   */
  const minimizeChat = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isMinimized: true,
    }));
  }, []);

  /**
   * Clears the current error
   */
  const clearError = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Resets the chat session
   */
  const resetChat = useCallback(() => {
    welcomeShownRef.current = false;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    setSession({
      isOpen: false,
      isMinimized: false,
      messages: [],
      isLoading: false,
      error: null,
      cooldownUntil: null,
    });
  }, []);

  /**
   * Starts a cooldown period
   */
  const startCooldown = useCallback((seconds: number) => {
    const cooldownUntil = Date.now() + seconds * 1000;

    setSession((prev) => ({
      ...prev,
      cooldownUntil,
    }));

    // Clear cooldown when time expires
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        cooldownUntil: null,
      }));
    }, seconds * 1000);
  }, []);

  /**
   * Sends a message to the chat API
   */
  const sendMessage = useCallback(
    async (content: string) => {
      // Check cooldown
      if (session.cooldownUntil && Date.now() < session.cooldownUntil) {
        return;
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        sender: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      };

      // Add user message and set loading
      setSession((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: content }),
        });

        const data: ChatResponse = await response.json();

        if (!data.success || data.error) {
          const error: ChatError = data.error || {
            type: 'backend_error',
            message: 'An unexpected error occurred',
            retryable: true,
          };

          // Handle rate limiting
          if (error.type === 'rate_limit' && error.retryAfter) {
            startCooldown(error.retryAfter);
          }

          // Update user message status to error and set error
          setSession((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg
            ),
            isLoading: false,
            error,
          }));

          return;
        }

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          sender: 'assistant',
          content: data.response || 'I understood your request.',
          timestamp: new Date(),
          status: 'sent',
        };

        // Update user message status and add assistant message
        setSession((prev) => ({
          ...prev,
          messages: prev.messages
            .map((msg) =>
              msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg
            )
            .concat(assistantMessage),
          isLoading: false,
        }));
      } catch (error) {
        // Network or unexpected error
        const chatError: ChatError = {
          type: 'network',
          message: 'Unable to connect. Please check your connection.',
          retryable: true,
        };

        setSession((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg
          ),
          isLoading: false,
          error: chatError,
        }));
      }
    },
    [session.cooldownUntil, startCooldown]
  );

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  return {
    session,
    openChat,
    closeChat,
    minimizeChat,
    sendMessage,
    clearError,
    resetChat,
  };
}
