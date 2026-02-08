export interface Message {
  _id: string;
  nickname: string;
  message: string;
  country: string;
  countryName: string;
  createdAt: string;
  expiresAt: string;
  timeRemaining: number;
  isHighlighted: boolean;
  reportCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    returned?: number;
  };
}

export type BurnState = 'normal' | 'warning' | 'burning';
