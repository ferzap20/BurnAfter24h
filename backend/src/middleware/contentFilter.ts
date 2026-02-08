import { Response, NextFunction } from 'express';
import { GeoRequest } from '../types';
import { containsBannedContent } from '../config/bannedWords';

export function filterContent(req: GeoRequest, res: Response, next: NextFunction): void {
  const { nickname, message } = req.body as { nickname?: string; message?: string };

  if (!nickname || !message) {
    next();
    return;
  }

  // Check banned words
  if (containsBannedContent(nickname) || containsBannedContent(message)) {
    res.status(451).json({
      success: false,
      error: 'Message contains prohibited content',
    });
    return;
  }

  // Check excessive special characters (> 30% of message)
  const specialCharCount = (message.match(/[^a-zA-Z0-9\s.,!?'"()\-]/g) || []).length;
  if (message.length > 0 && specialCharCount / message.length > 0.3) {
    res.status(400).json({
      success: false,
      error: 'Message contains too many special characters',
    });
    return;
  }

  next();
}
