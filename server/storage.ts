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
  getQueueEntries(date?: string): Promise<QueueEntry[]>;
  updateQueueStatus(id: string, status: string): Promise<QueueEntry>;
  updateQueueEntry(id: string, updates: Partial<QueueEntry>): Promise<QueueEntry>;
  recalculateActiveQueuePositions(bookingDate: Date): Promise<number>;
  reorderQueue(removedPosition: number): Promise<void>;
  
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
      dailySerialNumber: entry.dailySerialNumber,
      activeQueuePosition: entry.activeQueuePosition,
      bookingDate: entry.bookingDate,
      bookingDateTime: entry.bookingDateTime,
      status: entry.status,
      notificationSent: entry.notificationSent,
      notificationSentAt: entry.notificationSentAt,
      notificationStatus: entry.notificationStatus,
      calledAt: entry.calledAt,
      responseDeadline: entry.responseDeadline,
      respondedAt: entry.respondedAt,
      responseType: entry.responseType,
      message: entry.message,
      position: entry.position,
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
    const now = new Date();
    const bookingDate = new Date(now);
    bookingDate.setHours(0, 0, 0, 0);

    const totalTodayBookings = await MongoQueueEntry.countDocuments({ bookingDate });
    const dailySerialNumber = totalTodayBookings + 1;

    const activeTodayBookings = await MongoQueueEntry.countDocuments({
      bookingDate: bookingDate,
      status: { $in: ["waiting", "called", "confirmed"] }
    });
    const activeQueuePosition = activeTodayBookings + 1;

    const newEntryDoc = await MongoQueueEntry.create({
      ...entry,
      name: entry.name || undefined,
      dailySerialNumber,
      activeQueuePosition,
      bookingDate,
      bookingDateTime: now,
      status: 'waiting',
      position: activeQueuePosition
    });

    return this.mapQueueEntry(newEntryDoc);
  }

  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    const entry = mongoose.Types.ObjectId.isValid(id) 
      ? await MongoQueueEntry.findById(id)
      : await MongoQueueEntry.findOne({ dailySerialNumber: parseInt(id) || 0 });
    
    if (!entry) return undefined;
    
    const mapped = this.mapQueueEntry(entry);
    
    // Calculate real-time position if it's waiting, called or confirmed
    if (['waiting', 'called', 'confirmed'].includes(mapped.status)) {
      const position = await MongoQueueEntry.countDocuments({
        status: { $in: ['waiting', 'called', 'confirmed'] },
        bookingDate: entry.bookingDate,
        $or: [
          { dailySerialNumber: { $lt: entry.dailySerialNumber } }
        ]
      });
      mapped.activeQueuePosition = position + 1;
      mapped.position = position + 1;
    } else {
      mapped.activeQueuePosition = 0;
      mapped.position = 0; // Not in queue anymore
    }
    
    return mapped;
  }

  async getQueueEntries(dateStr?: string, statuses?: string[]): Promise<QueueEntry[]> {
    const filter: any = {};
    
    if (dateStr) {
      const bookingDate = new Date(dateStr);
      bookingDate.setHours(0, 0, 0, 0);
      filter.bookingDate = bookingDate;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.bookingDate = today;
    }

    const activeStatuses = statuses || ['waiting', 'called', 'confirmed'];
    const entries = await MongoQueueEntry.find({ 
      ...filter,
      status: { $in: activeStatuses } 
    }).sort({ dailySerialNumber: 1 }).exec();
    
    const mapped = entries.map((e: any, index: number) => {
      const entry = this.mapQueueEntry(e);
      if (['waiting', 'called', 'confirmed'].includes(entry.status)) {
        entry.activeQueuePosition = index + 1;
        entry.position = index + 1;
      } else {
        entry.activeQueuePosition = 0;
        entry.position = 0;
      }
      return entry;
    });

    if (statuses) {
      return mapped;
    }

    const inactiveEntries = await MongoQueueEntry.find({ 
      ...filter,
      status: { $nin: ['waiting', 'called', 'confirmed'] } 
    }).sort({ updatedAt: -1 }).exec();
    
    return [...mapped, ...inactiveEntries.map((e: any) => this.mapQueueEntry(e))];
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
    
    // If status changed to a terminal state, recalculate positions
    const isTerminal = (s: string) => ['completed', 'cancelled', 'expired', 'left'].includes(s);
    if (updates.status && isTerminal(updates.status)) {
      await this.recalculateActiveQueuePositions(updated.bookingDate);
    }
    
    return this.mapQueueEntry(updated);
  }

  async recalculateActiveQueuePositions(bookingDate: Date): Promise<number> {
    const activeBookings = await MongoQueueEntry.find({
      bookingDate,
      status: { $in: ["waiting", "called", "confirmed"] }
    }).sort({ dailySerialNumber: 1 });

    for (let i = 0; i < activeBookings.length; i++) {
      await MongoQueueEntry.updateOne(
        { _id: activeBookings[i]._id },
        { 
          activeQueuePosition: i + 1,
          position: i + 1,
          updatedAt: new Date()
        }
      );
    }
    return activeBookings.length;
  }

  async reorderQueue(removedPosition: number): Promise<void> {
    // This is now redundant as we use recalculateActiveQueuePositions
    // but we'll keep it for compatibility if called elsewhere
    return;
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
