import mongoose, { Schema, Document } from 'mongoose';
import { TWENTY_FOUR_HOURS_MS } from '../config/constants';

export interface IMessage extends Document {
  nickname: string;
  message: string;
  country: string;
  countryName: string;
  ipHash: string;
  createdAt: Date;
  expiresAt: Date;
  // Future extensibility
  burnTimeExtension: number;
  isHighlighted: boolean;
  isPrivate: boolean;
  recipientHash?: string;
  // Moderation
  reportCount: number;
  isHidden: boolean;
}

const MessageSchema = new Schema<IMessage>(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    country: {
      type: String,
      default: 'XX',
      maxlength: 2,
    },
    countryName: {
      type: String,
      default: 'Unknown',
      maxlength: 60,
    },
    ipHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
    // Future extensibility fields
    burnTimeExtension: {
      type: Number,
      default: 0,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    recipientHash: {
      type: String,
    },
    // Moderation
    reportCount: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Additional indexes for query performance
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ isHidden: 1 });
MessageSchema.index({ ipHash: 1 });
MessageSchema.index({ isHighlighted: -1, createdAt: -1 });

// Virtual: compute expiration from createdAt if not set
MessageSchema.pre('save', function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(this.createdAt.getTime() + TWENTY_FOUR_HOURS_MS + this.burnTimeExtension);
  }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
