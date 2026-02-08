import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { GeoRequest, MessageResponse } from '../types';
import {
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  TWENTY_FOUR_HOURS_MS,
} from '../config/constants';

function formatMessage(msg: InstanceType<typeof Message>): MessageResponse {
  const now = Date.now();
  const expiresAt = new Date(msg.expiresAt).getTime();
  return {
    _id: (msg._id as mongoose.Types.ObjectId).toString(),
    nickname: msg.nickname,
    message: msg.message,
    country: msg.country,
    countryName: msg.countryName,
    createdAt: msg.createdAt.toISOString(),
    expiresAt: msg.expiresAt.toISOString(),
    timeRemaining: Math.max(0, expiresAt - now),
    isHighlighted: msg.isHighlighted,
    reportCount: msg.reportCount,
  };
}

export async function createMessage(req: GeoRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { nickname, message } = req.body as { nickname?: string; message?: string };

    // Validate inputs
    if (!nickname || typeof nickname !== 'string') {
      res.status(400).json({ success: false, error: 'Nickname is required' });
      return;
    }
    if (nickname.trim().length < NICKNAME_MIN_LENGTH || nickname.trim().length > NICKNAME_MAX_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Nickname must be between ${NICKNAME_MIN_LENGTH} and ${NICKNAME_MAX_LENGTH} characters`,
      });
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }
    if (message.trim().length > MESSAGE_MAX_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`,
      });
      return;
    }

    const now = new Date();
    const newMessage = new Message({
      nickname: nickname.trim(),
      message: message.trim(),
      country: req.geoData?.country || 'XX',
      countryName: req.geoData?.countryName || 'Unknown',
      ipHash: req.ipHash || 'unknown',
      createdAt: now,
      expiresAt: new Date(now.getTime() + TWENTY_FOUR_HOURS_MS),
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: formatMessage(newMessage),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req: GeoRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const skip = parseInt(req.query.skip as string) || 0;

    const now = new Date();
    const [messages, total] = await Promise.all([
      Message.find({
        expiresAt: { $gt: now },
        isHidden: false,
        isPrivate: false,
      })
        .sort({ isHighlighted: -1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Message.countDocuments({
        expiresAt: { $gt: now },
        isHidden: false,
        isPrivate: false,
      }),
    ]);

    const nowMs = Date.now();
    const formatted = messages.map((msg) => ({
      _id: (msg._id as mongoose.Types.ObjectId).toString(),
      nickname: msg.nickname,
      message: msg.message,
      country: msg.country,
      countryName: msg.countryName,
      createdAt: msg.createdAt.toISOString(),
      expiresAt: msg.expiresAt.toISOString(),
      timeRemaining: Math.max(0, new Date(msg.expiresAt).getTime() - nowMs),
      isHighlighted: msg.isHighlighted,
      reportCount: msg.reportCount,
    }));

    res.json({
      success: true,
      data: formatted,
      meta: { total, returned: formatted.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessageById(req: GeoRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid message ID' });
      return;
    }

    const msg = await Message.findOne({
      _id: id,
      expiresAt: { $gt: new Date() },
      isHidden: false,
    });

    if (!msg) {
      res.status(404).json({ success: false, error: 'Message not found or expired' });
      return;
    }

    res.json({ success: true, data: formatMessage(msg) });
  } catch (error) {
    next(error);
  }
}
