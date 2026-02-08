import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Report } from '../models/Report';
import { Message } from '../models/Message';
import { GeoRequest } from '../types';
import { AUTO_HIDE_REPORT_THRESHOLD, REPORT_REASON_MAX_LENGTH } from '../config/constants';

export async function createReport(req: GeoRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messageId, reason } = req.body as { messageId?: string; reason?: string };

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      res.status(400).json({ success: false, error: 'Invalid message ID' });
      return;
    }

    if (reason && reason.length > REPORT_REASON_MAX_LENGTH) {
      res.status(400).json({
        success: false,
        error: `Reason must not exceed ${REPORT_REASON_MAX_LENGTH} characters`,
      });
      return;
    }

    // Check message exists and is not expired
    const message = await Message.findOne({
      _id: messageId,
      expiresAt: { $gt: new Date() },
      isHidden: false,
    });

    if (!message) {
      res.status(404).json({ success: false, error: 'Message not found or expired' });
      return;
    }

    const ipHash = req.ipHash || 'unknown';

    // Check for duplicate report
    const existingReport = await Report.findOne({
      messageId: new mongoose.Types.ObjectId(messageId),
      reporterIpHash: ipHash,
    });

    if (existingReport) {
      res.status(409).json({ success: false, error: 'You have already reported this message' });
      return;
    }

    // Create report
    const report = new Report({
      messageId: new mongoose.Types.ObjectId(messageId),
      reporterIpHash: ipHash,
      reason: reason?.trim(),
    });

    await report.save();

    // Increment report count and auto-hide if threshold reached
    const newReportCount = message.reportCount + 1;
    await Message.updateOne(
      { _id: messageId },
      {
        $inc: { reportCount: 1 },
        ...(newReportCount >= AUTO_HIDE_REPORT_THRESHOLD ? { isHidden: true } : {}),
      }
    );

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    // Handle duplicate key error (concurrent reports)
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, error: 'You have already reported this message' });
      return;
    }
    next(error);
  }
}
