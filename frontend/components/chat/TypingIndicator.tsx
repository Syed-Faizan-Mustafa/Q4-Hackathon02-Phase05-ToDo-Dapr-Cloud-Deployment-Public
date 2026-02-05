/**
 * TypingIndicator Component
 * Feature: 003-ai-todo-chatbot
 * Task: T025
 *
 * Animated typing indicator shown while assistant is processing.
 */

'use client';

import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '600ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '600ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '600ms' }}
          />
        </div>
      </div>
    </div>
  );
}
