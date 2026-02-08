import api from './api';
import type { Message, ApiResponse } from '../types';

export const messageService = {
  async getMessages(limit = 100): Promise<Message[]> {
    const response = await api.get<ApiResponse<Message[]>>('/messages', {
      params: { limit, sort: 'newest' },
    });
    return response.data.data || [];
  },

  async getMessage(id: string): Promise<Message> {
    const response = await api.get<ApiResponse<Message>>(`/messages/${id}`);
    if (!response.data.data) throw new Error('Message not found');
    return response.data.data;
  },

  async postMessage(nickname: string, message: string): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>('/messages', {
      nickname,
      message,
    });
    if (!response.data.data) throw new Error('Failed to post message');
    return response.data.data;
  },
};
