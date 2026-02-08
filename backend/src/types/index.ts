import { Request } from 'express';

export interface GeoData {
  country: string;
  countryName: string;
}

export interface GeoRequest extends Request {
  geoData?: GeoData;
  ipHash?: string;
}

export interface MessageResponse {
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
