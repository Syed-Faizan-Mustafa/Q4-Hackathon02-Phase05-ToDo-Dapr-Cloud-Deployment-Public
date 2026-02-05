/**
 * ChatInput Component
 * Feature: 003-ai-todo-chatbot
 * Task: T024, T063
 *
 * Text input with send button for chat messages.
 * Includes message length validation (max 1000 chars).
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MAX_MESSAGE_LENGTH } from '@/lib/agents/types';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) {
      return;
    }

    // Validate length
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      await onSend(trimmedMessage);
    } finally {
      setIsSending(false);
      // Re-focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isOverLimit = message.length > MAX_MESSAGE_LENGTH;
  const isDisabled = disabled || isSending || !message.trim() || isOverLimit;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       dark:bg-gray-700 dark:text-white
                       ${isOverLimit
                         ? 'border-red-500 focus:ring-red-500'
                         : 'border-gray-300 dark:border-gray-600'
                       }`}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
            aria-label="Chat message input"
            aria-describedby={isOverLimit ? 'char-limit-error' : undefined}
          />

          {/* Character count (only show when approaching limit) */}
          {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <span
              id="char-limit-error"
              className={`absolute right-2 bottom-1 text-xs
                         ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={isDisabled}
          className="shrink-0 w-10 h-10 flex items-center justify-center
                     bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600
                     text-white rounded-lg transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {isSending ? (
            // Loading spinner
            <svg
              className="animate-spin w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            // Send icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error message for character limit */}
      {isOverLimit && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          Message exceeds {MAX_MESSAGE_LENGTH} character limit
        </p>
      )}
    </form>
  );
}
