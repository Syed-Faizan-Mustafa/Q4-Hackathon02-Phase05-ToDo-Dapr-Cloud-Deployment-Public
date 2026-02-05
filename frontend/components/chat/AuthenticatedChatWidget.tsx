/**
 * AuthenticatedChatWidget Component
 * Feature: 003-ai-todo-chatbot
 * Task: T022
 *
 * Wrapper that only renders ChatWidget when user is authenticated.
 */

'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatWidget } from './ChatWidget';

export function AuthenticatedChatWidget() {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  // Don't render while checking or if not authenticated
  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  return <ChatWidget />;
}
