import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message);

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ success: false, error: 'Internal server error' });
  } else {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
}
