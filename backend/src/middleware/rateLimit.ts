import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import crypto from 'crypto';

function getIpHash(req: Request): string {
  // Extract IP, normalize for IPv6 via ipKeyGenerator, then SHA-256 hash for privacy
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0';
  const normalizedIp = ipKeyGenerator(rawIp);
  return crypto.createHash('sha256').update(normalizedIp).digest('hex');
}

export const postMessageLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_POSTS || '5', 10),
  keyGenerator: getIpHash,
  skip: () => false, // explicitly no skipping
  validate: { xForwardedForHeader: false }, // we handle x-forwarded-for ourselves
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many messages posted. Please wait before posting again.',
  },
  statusCode: 429,
});

export const reportLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REPORTS || '10', 10),
  keyGenerator: getIpHash,
  skip: () => false,
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many reports submitted. Please wait before reporting again.',
  },
  statusCode: 429,
});
