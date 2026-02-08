import { ApiError } from './api';
import type { Message } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const messageService = {
  async getMessages(limit = 100): Promise<Message[]> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/messages?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  },

  async postMessage(nickname: string, message: string): Promise<Message> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.error || 'Failed to post message');
      }

      const data = await response.json();
      if (!data.data) throw new ApiError('Failed to post message');
      return data.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Failed to post message');
    }
  },
};
