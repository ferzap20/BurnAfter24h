import { Response, NextFunction } from 'express';
import axios from 'axios';
import { GeoRequest } from '../types';

const geoCache = new Map<string, { country: string; countryName: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function detectCountry(req: GeoRequest, _res: Response, next: NextFunction): Promise<void> {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0';

  // Fallback for localhost/development
  if (ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::ffff:127.0.0.1') {
    req.geoData = { country: 'XX', countryName: 'Localhost' };
    return next();
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    req.geoData = { country: cached.country, countryName: cached.countryName };
    return next();
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      timeout: 3000,
    });

    if (response.data.status === 'success') {
      const geoData = {
        country: response.data.countryCode || 'XX',
        countryName: response.data.country || 'Unknown',
      };
      geoCache.set(ip, { ...geoData, timestamp: Date.now() });
      req.geoData = geoData;
    } else {
      req.geoData = { country: 'XX', countryName: 'Unknown' };
    }
  } catch {
    req.geoData = { country: 'XX', countryName: 'Unknown' };
  }

  next();
}
