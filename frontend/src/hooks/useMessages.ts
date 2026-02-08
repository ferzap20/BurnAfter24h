import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import { messageService } from '../services/messageService';

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await messageService.getMessages(100);
      // Filter out client-side expired messages
      const now = Date.now();
      const active = data.filter((m) => new Date(m.expiresAt).getTime() > now);
      setMessages(active);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [msg, ...prev]);
  }, []);

  return { messages, loading, error, refresh: fetchMessages, addMessage, lastUpdated };
}
