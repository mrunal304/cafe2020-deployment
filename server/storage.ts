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
      queueNumber: entry.queueNumber,
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
    const lastEntry = await (MongoQueueEntry.findOne({ status: 'waiting' }).sort({ position: -1 }) as any).exec();
    const nextPosition = lastEntry && lastEntry.position ? lastEntry.position + 1 : 1;
    
    const lastQueueNumberEntry = await (MongoQueueEntry.findOne({}, { queueNumber: 1 }).sort({ queueNumber: -1 }) as any).exec();
    const nextQueueNumber = (lastQueueNumberEntry?.queueNumber || 0) + 1;

    // Double check for duplicate key if someone else inserted
    let finalQueueNumber = nextQueueNumber;
    let existing = await (MongoQueueEntry.findOne({ queueNumber: finalQueueNumber }) as any).exec();
    while (existing) {
      finalQueueNumber++;
      existing = await (MongoQueueEntry.findOne({ queueNumber: finalQueueNumber }) as any).exec();
    }

    const newEntry = await MongoQueueEntry.create({
      ...entry,
      name: entry.name || undefined,
      queueNumber: finalQueueNumber,
      position: nextPosition,
      status: 'waiting'
    });
    return this.mapQueueEntry(newEntry);
  }

  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    const entry = mongoose.Types.ObjectId.isValid(id) 
      ? await MongoQueueEntry.findById(id)
      : await MongoQueueEntry.findOne({ queueNumber: parseInt(id) || 0 });
    
    if (!entry) return undefined;
    
    const mapped = this.mapQueueEntry(entry);
    
    // Calculate real-time position if it's waiting or called
    if (mapped.status === 'waiting' || mapped.status === 'called') {
      const position = await MongoQueueEntry.countDocuments({
        status: { $in: ['waiting', 'called'] },
        createdAt: { $lt: entry.createdAt },
        // Same date check
        $expr: {
          $eq: [
            { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            { $dateToString: { format: "%Y-%m-%d", date: entry.createdAt } }
          ]
        }
      });
      mapped.position = position + 1;
    } else {
      mapped.position = 0; // Not in queue anymore
    }
    
    return mapped;
  }

  async getQueueEntries(date?: string, statuses?: string[]): Promise<QueueEntry[]> {
    const filter: any = {};
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const activeStatuses = statuses || ['waiting', 'called', 'confirmed'];
    const entries = await (MongoQueueEntry.find({ 
      ...filter,
      status: { $in: activeStatuses } 
    }).sort({ updatedAt: -1 }) as any).exec();
    
    const mapped = entries.map((e: any) => {
      const entry = this.mapQueueEntry(e);
      // Only set position for truly active ones if no statuses filter was provided
      if (!statuses && ['waiting', 'called', 'confirmed'].includes(entry.status)) {
         // position is set based on creation order for active ones
      }
      return entry;
    });

    // If statuses were provided, we already filtered and sorted, just return
    if (statuses) {
      return mapped;
    }

    // Default behavior for Dashboard (Active Queue)
    const activeEntries = mapped.filter((e: any) => ['waiting', 'called', 'confirmed'].includes(e.status)).sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
    activeEntries.forEach((e: any, i: number) => e.position = i + 1);

    const inactiveEntries = await (MongoQueueEntry.find({ 
      ...filter,
      status: { $nin: ['waiting', 'called', 'confirmed'] } 
    }).sort({ updatedAt: -1 }) as any).exec();
    
    return [...activeEntries, ...inactiveEntries.map((e: any) => this.mapQueueEntry(e))];
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

  async reorderQueue(removedPosition: number): Promise<void> {
    console.log('=== Reordering Queue ===');
    console.log('Removed position:', removedPosition);
    
    try {
      const entriesToUpdate = await MongoQueueEntry.find({
        status: 'waiting',
        position: { $gt: removedPosition }
      }).sort({ position: 1 });
      
      for (const entry of entriesToUpdate) {
        if (entry.position) {
          entry.position = entry.position - 1;
          await entry.save();
          console.log(`Updated ${entry.name}: Position moved to ${entry.position}`);
        }
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
    }
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
