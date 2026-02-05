/**
 * ChatWindow Component
 * Feature: 003-ai-todo-chatbot
 * Task: T014, T016, T018, T019, T026, T032
 *
 * Main chat window container (400x500px desktop, full-width mobile).
 * Includes header with minimize/close buttons and CSS transitions.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, ChatError } from '@/lib/agents/types';

interface ChatWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  error: ChatError | null;
  cooldownUntil: number | null;
  onClose: () => void;
  onMinimize: () => void;
  messageContent?: React.ReactNode;
  inputContent?: React.ReactNode;
}

export function ChatWindow({
  isOpen,
  isMinimized,
  messages,
  isLoading,
  error,
  cooldownUntil,
  onClose,
  onMinimize,
  messageContent,
  inputContent,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message (T032)
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isMinimized]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Calculate remaining cooldown time
  const cooldownRemaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
    : 0;

  return (
    <div
      className={`fixed bottom-6 right-6
                  w-[400px] h-[500px] max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0
                  bg-white dark:bg-gray-800 rounded-lg max-sm:rounded-none
                  shadow-2xl border border-gray-200 dark:border-gray-700
                  flex flex-col overflow-hidden
                  transition-all duration-300 ease-out
                  ${isMinimized ? 'h-[52px] max-sm:h-[52px]' : ''}
                  ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  z-50`}
      role="dialog"
      aria-modal="true"
      aria-label="Chat assistant"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
          <h2 className="font-semibold text-sm">Task Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Minimize button */}
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              {isMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              )}
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content area - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                Start a conversation...
              </div>
            )}
            {messageContent}
            <div ref={messagesEndRef} />
          </div>

          {/* Error display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
            </div>
          )}

          {/* Cooldown indicator */}
          {cooldownRemaining > 0 && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Please wait {cooldownRemaining}s before sending another message
              </p>
            </div>
          )}

          {/* Input area */}
          {inputContent}
        </>
      )}
    </div>
  );
}
