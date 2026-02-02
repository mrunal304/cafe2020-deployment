import mongoose from "mongoose";
import {
  MongoUser,
  MongoQueueEntry,
  MongoNotification,
  type IUser,
  type IQueueEntry,
  type INotification
} from "@shared/mongo-schema";
import {
  type QueueEntry,
  type InsertQueueEntry,
  type User,
  type InsertUser,
  type Notification,
} from "@shared/schema";

export interface IStorage {
  // User/Admin
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Queue
  createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntry>;
  getQueueEntry(id: string): Promise<QueueEntry | undefined>;
  getQueueEntries(): Promise<QueueEntry[]>;
  updateQueueStatus(id: string, status: string): Promise<QueueEntry>;
  updateQueueEntry(id: string, updates: Partial<QueueEntry>): Promise<QueueEntry>;
  
  // Expiry check
  getExpiredEntries(threshold: Date): Promise<QueueEntry[]>;

  // Notifications
  logNotification(notification: any): Promise<Notification>;
}

export class MongoStorage implements IStorage {
  private mapUser(user: IUser): User {
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
    } as any;
  }

  private mapQueueEntry(entry: IQueueEntry): QueueEntry {
    return {
      id: entry._id.toString(),
      name: entry.name,
      phoneNumber: entry.phoneNumber,
      numberOfPeople: entry.numberOfPeople,
      queueNumber: entry.queueNumber,
      status: entry.status,
      notificationSent: entry.notificationSent,
      notificationSentAt: entry.notificationSentAt,
      notificationStatus: entry.notificationStatus,
      calledAt: entry.calledAt,
      responseDeadline: entry.responseDeadline,
      respondedAt: entry.respondedAt,
      responseType: entry.responseType,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    } as any;
  }

  private mapNotification(notif: INotification): Notification {
    return {
      id: notif._id.toString(),
      queueId: notif.queueId.toString(),
      phoneNumber: notif.phoneNumber,
      message: notif.message,
      type: notif.type,
      status: notif.status,
      twilioSid: notif.twilioSid,
      error: notif.error,
      sentAt: notif.sentAt,
    } as any;
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await MongoUser.findById(id);
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await MongoUser.findOne({ username });
    return user ? this.mapUser(user) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await MongoUser.create({
      ...user,
      createdAt: new Date(),
    });
    return this.mapUser(newUser);
  }

  async createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntry> {
    const lastEntry = await MongoQueueEntry.findOne().sort({ queueNumber: -1 });
    const nextQueueNumber = lastEntry ? lastEntry.queueNumber + 1 : 1;

    const newEntry = await MongoQueueEntry.create({
      ...entry,
      name: entry.name || undefined,
      queueNumber: nextQueueNumber,
      status: 'waiting'
    });
    return this.mapQueueEntry(newEntry);
  }

  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    const entry = mongoose.Types.ObjectId.isValid(id) 
      ? await MongoQueueEntry.findById(id)
      : await MongoQueueEntry.findOne({ queueNumber: parseInt(id) || 0 });
    return entry ? this.mapQueueEntry(entry) : undefined;
  }

  async getQueueEntries(): Promise<QueueEntry[]> {
    const entries = await MongoQueueEntry.find().sort({ createdAt: -1 });
    return entries.map(e => this.mapQueueEntry(e));
  }

  async updateQueueStatus(id: string, status: string): Promise<QueueEntry> {
    const updated = await MongoQueueEntry.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) throw new Error("Entry not found");
    return this.mapQueueEntry(updated);
  }

  async updateQueueEntry(id: string, updates: Partial<QueueEntry>): Promise<QueueEntry> {
    const updated = await MongoQueueEntry.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) throw new Error("Entry not found");
    return this.mapQueueEntry(updated);
  }

  async getExpiredEntries(threshold: Date): Promise<QueueEntry[]> {
    const entries = await MongoQueueEntry.find({
      status: 'called',
      responseDeadline: { $lt: threshold }
    });
    return entries.map(e => this.mapQueueEntry(e));
  }

  async logNotification(notification: any): Promise<Notification> {
    const log = await MongoNotification.create(notification);
    return this.mapNotification(log);
  }
}

export const storage = new MongoStorage();
