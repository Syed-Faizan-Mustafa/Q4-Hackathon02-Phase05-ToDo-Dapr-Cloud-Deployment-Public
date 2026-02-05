/**
 * ChatMessage Component
 * Feature: 003-ai-todo-chatbot
 * Task: T023
 *
 * Displays individual chat messages with user/assistant styling.
 */

'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/agents/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isError = message.status === 'error';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      role="listitem"
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        } ${isError ? 'opacity-70' : ''}`}
      >
        {/* Message content with newline support */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Status indicator for user messages */}
        {isUser && (
          <div className="flex items-center justify-end mt-1 gap-1">
            {message.status === 'sending' && (
              <span className="text-xs text-blue-200">Sending...</span>
            )}
            {message.status === 'error' && (
              <span className="text-xs text-red-300">Failed to send</span>
            )}
            {message.status === 'sent' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3 h-3 text-blue-200"
                aria-label="Sent"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
