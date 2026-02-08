import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { GeoRequest } from '../types';

export function hashIp(req: GeoRequest, _res: Response, next: NextFunction): void {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0';

  req.ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  next();
}
