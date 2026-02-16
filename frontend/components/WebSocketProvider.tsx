'use client';

/**
 * WebSocket Provider - Real-time task updates via WebSocket connection.
 * Feature: Phase 5 Part A - T028
 *
 * Connects to the WebSocket Service and updates task list in real-time.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  task_id?: string;
  task_data?: Record<string, unknown>;
  notification?: Record<string, unknown>;
  timestamp?: string;
  message?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  status: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  status: 'disconnected',
  lastMessage: null,
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  userId: string | undefined;
  jwt: string | undefined;
  wsUrl?: string;
}

const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 25000; // 25 seconds (server heartbeat is 30s)

export function WebSocketProvider({
  children,
  userId,
  jwt,
  wsUrl,
}: WebSocketProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!userId || !jwt) return;

    const baseUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const url = `${baseUrl}/ws/${userId}?token=${encodeURIComponent(jwt)}`;

    cleanup();
    setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Invalidate task queries on task changes
          if (['created', 'updated', 'completed', 'deleted'].includes(message.type)) {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Don't reconnect if closed intentionally (code 4001 = auth failure)
        if (event.code === 4001) return;

        // Attempt reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };
    } catch {
      setStatus('error');
    }
  }, [userId, jwt, wsUrl, cleanup, queryClient]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return (
    <WebSocketContext.Provider value={{ status, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Connection status indicator component
 */
export function ConnectionStatusIndicator() {
  const { status } = useWebSocket();

  if (status === 'disconnected') return null;

  const colors: Record<ConnectionStatus, string> = {
    connecting: 'bg-yellow-400',
    connected: 'bg-green-400',
    disconnected: 'bg-gray-400',
    error: 'bg-red-400',
  };

  const labels: Record<ConnectionStatus, string> = {
    connecting: 'Connecting...',
    connected: 'Live',
    disconnected: 'Offline',
    error: 'Connection error',
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />
      <span>{labels[status]}</span>
    </div>
  );
}
