/**
 * ChatBubble Component
 * Feature: 003-ai-todo-chatbot
 * Task: T013
 *
 * Floating chat bubble icon (60x60px) that opens the chat window.
 * Positioned fixed in bottom-right corner.
 */

'use client';

import React from 'react';

interface ChatBubbleProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatBubble({ onClick, isOpen }: ChatBubbleProps) {
  // Don't show bubble when chat is open
  if (isOpen) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-[60px] h-[60px] bg-blue-600 hover:bg-blue-700
                 text-white rounded-full shadow-lg hover:shadow-xl
                 flex items-center justify-center
                 transition-all duration-200 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 z-50"
      aria-label="Open chat assistant"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      {/* Chat icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </svg>
    </button>
  );
}
