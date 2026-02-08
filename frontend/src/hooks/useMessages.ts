import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import { messageService } from '../services/messageService';

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds
const REPORTED_KEY = 'burn_reported_messages';

function getReportedIds(): Set<string> {
  try {
    const data = localStorage.getItem(REPORTED_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await messageService.getMessages(100);
      const now = Date.now();
      const reported = getReportedIds();
      const active = data.filter(
        (m) => new Date(m.expiresAt).getTime() > now && !reported.has(m._id)
      );
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

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== id));
  }, []);

  return { messages, loading, error, refresh: fetchMessages, addMessage, removeMessage, lastUpdated };
}
