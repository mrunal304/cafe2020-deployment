import { db } from "./db";
import {
  queueEntries,
  users,
  notifications,
  type QueueEntry,
  type InsertQueueEntry,
  type User,
  type InsertUser,
  type Notification,
  type UpdateQueueStatusRequest
} from "@shared/schema";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // User/Admin
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Queue
  createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntry>;
  getQueueEntry(id: number): Promise<QueueEntry | undefined>;
  getQueueEntries(): Promise<QueueEntry[]>;
  updateQueueStatus(id: number, status: string): Promise<QueueEntry>;
  updateQueueEntry(id: number, updates: Partial<QueueEntry>): Promise<QueueEntry>;
  
  // Expiry check
  getExpiredEntries(threshold: Date): Promise<QueueEntry[]>;

  // Notifications
  logNotification(notification: any): Promise<Notification>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createQueueEntry(entry: InsertQueueEntry): Promise<QueueEntry> {
    // Get last queue number
    const lastEntry = await db.select().from(queueEntries).orderBy(desc(queueEntries.queueNumber)).limit(1);
    const nextQueueNumber = lastEntry.length > 0 ? lastEntry[0].queueNumber + 1 : 1;

    const [newEntry] = await db.insert(queueEntries).values({
      ...entry,
      queueNumber: nextQueueNumber,
      status: 'waiting'
    }).returning();
    return newEntry;
  }

  async getQueueEntry(id: number): Promise<QueueEntry | undefined> {
    const [entry] = await db.select().from(queueEntries).where(eq(queueEntries.id, id));
    return entry;
  }

  async getQueueEntries(): Promise<QueueEntry[]> {
    return await db.select().from(queueEntries).orderBy(desc(queueEntries.createdAt));
  }

  async updateQueueStatus(id: number, status: string): Promise<QueueEntry> {
    const [updated] = await db.update(queueEntries)
      .set({ status, updatedAt: new Date() })
      .where(eq(queueEntries.id, id))
      .returning();
    return updated;
  }

  async updateQueueEntry(id: number, updates: Partial<QueueEntry>): Promise<QueueEntry> {
    const [updated] = await db.update(queueEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(queueEntries.id, id))
      .returning();
    return updated;
  }

  async getExpiredEntries(threshold: Date): Promise<QueueEntry[]> {
    return await db.select().from(queueEntries)
      .where(and(
        eq(queueEntries.status, 'called'),
        lt(queueEntries.responseDeadline, threshold)
      ));
  }

  async logNotification(notification: any): Promise<Notification> {
    const [log] = await db.insert(notifications).values(notification).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
