import api from './api';
import type { ApiResponse } from '../types';

export const reportService = {
  async reportMessage(messageId: string, reason?: string): Promise<void> {
    await api.post<ApiResponse<null>>('/reports', { messageId, reason });
  },
};
