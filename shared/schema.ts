import { z } from "zod";

// NOTE: These types and schemas are maintained for frontend compatibility 
// and validation, but data is stored in MongoDB via Mongoose.

// === TYPES ===

export type User = {
  id: string;
  username: string;
  password?: string;
  role: string;
  createdAt?: Date;
};

export type QueueEntry = {
  id: string;
  name: string;
  phoneNumber: string;
  numberOfPeople: number;
  dailySerialNumber: number;
  activeQueuePosition: number;
  bookingDate: Date;
  bookingDateTime: Date;
  status: 'waiting' | 'called' | 'confirmed' | 'expired' | 'cancelled' | 'completed' | 'left';
  notificationSent: boolean;
  notificationSentAt?: Date;
  notificationStatus: 'pending' | 'sent' | 'failed';
  calledAt?: Date;
  responseDeadline?: Date;
  respondedAt?: Date;
  responseType?: 'accepted' | 'cancelled' | 'expired';
  message?: string;
  position?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Notification = {
  id: string;
  queueId: string;
  phoneNumber: string;
  message: string;
  type: 'sms' | 'call';
  status: 'sent' | 'failed' | 'pending';
  twilioSid?: string;
  error?: string;
  sentAt?: Date;
};

// === SCHEMAS ===

// We'll define a simple zod schema for queue creation validation
export const insertQueueSchema = z.object({
  name: z.string().default("Guest"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
  numberOfPeople: z.number().min(1, "Party size must be at least 1")
});

export type InsertUser = {
  username: string;
  password?: string;
  role: string;
};

export type InsertQueueEntry = z.infer<typeof insertQueueSchema>;

export type CreateQueueRequest = InsertQueueEntry;
export type UpdateQueueStatusRequest = { status: QueueEntry['status'] };
