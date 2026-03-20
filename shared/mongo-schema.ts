import mongoose, { Schema, type Document } from "mongoose";

// === COUNTER SCHEMA (atomic sequence generator) ===
const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const MongoCounter = mongoose.model("Counter", CounterSchema);

// === USER SCHEMA ===
export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MongoUser = mongoose.model<IUser>("User", UserSchema);

// === CUSTOMER CARD SCHEMA ===
export interface ICustomerCard extends Document {
  phoneNumber: string;
  name: string;
  email?: string | null;
  totalVisits: number;
  firstVisitDate: Date;
  lastVisitDate: Date;
  visits: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerCardSchema: Schema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  totalVisits: { type: Number, default: 0 },
  firstVisitDate: { type: Date, default: Date.now },
  lastVisitDate: { type: Date, default: Date.now },
  visits: [{ type: Schema.Types.ObjectId, ref: 'QueueEntry' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const MongoCustomerCard = mongoose.model<ICustomerCard>("CustomerCard", CustomerCardSchema);

// === QUEUE ENTRY SCHEMA ===
export interface IQueueEntry extends Document {
  name: string;
  phoneNumber: string;
  numberOfPeople: number;
  queueNumber?: number;
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
  customerCardId?: mongoose.Types.ObjectId;
  visitNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QueueEntrySchema: Schema = new Schema({
  name: { type: String, default: "Guest" },
  phoneNumber: { type: String, required: true },
  numberOfPeople: { type: Number, required: true },
  queueNumber: { type: Number },
  dailySerialNumber: { type: Number, required: true },
  activeQueuePosition: { type: Number, required: true },
  bookingDate: { type: Date, required: true },
  bookingDateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'called', 'confirmed', 'expired', 'cancelled', 'completed', 'left'],
    default: 'waiting',
    required: true 
  },
  notificationSent: { type: Boolean, default: false },
  notificationSentAt: { type: Date },
  notificationStatus: { 
    type: String, 
    enum: ['pending', 'sent', 'failed'],
    default: 'pending' 
  },
  calledAt: { type: Date },
  responseDeadline: { type: Date },
  respondedAt: { type: Date },
  responseType: { 
    type: String, 
    enum: ['accepted', 'cancelled', 'expired'] 
  },
  message: { type: String },
  position: { type: Number },
  customerCardId: { type: Schema.Types.ObjectId, ref: 'CustomerCard' },
  visitNumber: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

QueueEntrySchema.index({ bookingDate: 1, dailySerialNumber: 1 }, { unique: true });
QueueEntrySchema.index({ queueNumber: 1 }, { unique: true, sparse: true });

export const MongoQueueEntry = mongoose.model<IQueueEntry>("QueueEntry", QueueEntrySchema);

// === NOTIFICATION SCHEMA ===
export interface INotification extends Document {
  queueId: mongoose.Types.ObjectId;
  phoneNumber: string;
  message: string;
  type: 'sms' | 'call';
  status: 'sent' | 'failed' | 'pending';
  twilioSid?: string;
  error?: string;
  sentAt?: Date;
}

const NotificationSchema: Schema = new Schema({
  queueId: { type: Schema.Types.ObjectId, ref: 'QueueEntry' },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['sms', 'call'], default: 'sms' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], required: true },
  twilioSid: { type: String },
  error: { type: String },
  sentAt: { type: Date },
});

export const MongoNotification = mongoose.model<INotification>("Notification", NotificationSchema);
