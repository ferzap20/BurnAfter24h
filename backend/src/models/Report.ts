import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  messageId: mongoose.Types.ObjectId;
  reporterIpHash: string;
  reason?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewerNote?: string;
}

const ReportSchema = new Schema<IReport>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    reporterIpHash: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
    },
    reviewerNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from same IP on same message
ReportSchema.index({ messageId: 1, reporterIpHash: 1 }, { unique: true });
ReportSchema.index({ messageId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
