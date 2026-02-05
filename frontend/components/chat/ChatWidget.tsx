/**
 * ChatWidget Component
 * Feature: 003-ai-todo-chatbot
 * Task: T015, T017, T020, T026, T027
 *
 * Container component that orchestrates ChatBubble and ChatWindow.
 * Handles Escape key and keyboard navigation.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatWindow } from './ChatWindow';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '@/hooks/useChat';

export function ChatWidget() {
  const {
    session,
    openChat,
    closeChat,
    minimizeChat,
    sendMessage,
    clearError,
  } = useChat();

  // Handle Escape key to close chat (T017)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && session.isOpen && !session.isMinimized) {
        closeChat();
      }
    },
    [session.isOpen, session.isMinimized, closeChat]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Clear error when sending new message (T027)
  const handleSendMessage = async (message: string) => {
    if (session.error) {
      clearError();
    }
    await sendMessage(message);
  };

  // Check if in cooldown
  const isInCooldown = session.cooldownUntil
    ? Date.now() < session.cooldownUntil
    : false;

  // Message content (T026)
  const messageContent = (
    <>
      {session.messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {session.isLoading && <TypingIndicator />}
    </>
  );

  // Input content (T027)
  const inputContent = (
    <ChatInput
      onSend={handleSendMessage}
      disabled={session.isLoading || isInCooldown}
      placeholder={isInCooldown ? 'Please wait...' : 'Type a message...'}
    />
  );

  return (
    <>
      {/* Floating chat bubble */}
      <ChatBubble onClick={openChat} isOpen={session.isOpen} />

      {/* Chat window with integrated components */}
      <ChatWindow
        isOpen={session.isOpen}
        isMinimized={session.isMinimized}
        messages={session.messages}
        isLoading={session.isLoading}
        error={session.error}
        cooldownUntil={session.cooldownUntil}
        onClose={closeChat}
        onMinimize={minimizeChat}
        messageContent={messageContent}
        inputContent={inputContent}
      />
    </>
  );
}
