import { ApiError } from './api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const reportService = {
  async reportMessage(messageId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.error || 'Failed to report message');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : 'Failed to report message');
    }
  },
};
