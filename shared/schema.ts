import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Admin Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Will be hashed
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Queue Entries
export const queueEntries = pgTable("queue_entries", {
  id: serial("id").primaryKey(),
  name: text("name").default("Guest"),
  phoneNumber: text("phone_number").notNull(),
  numberOfPeople: integer("number_of_people").notNull(),
  queueNumber: integer("queue_number").notNull().unique(), // Auto-incremented in storage
  status: text("status", { enum: ['waiting', 'called', 'confirmed', 'expired', 'cancelled', 'completed'] }).default('waiting').notNull(),
  
  // Notification tracking
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  notificationStatus: text("notification_status", { enum: ['pending', 'sent', 'failed'] }).default('pending'),
  
  // Timer and response tracking
  calledAt: timestamp("called_at"),
  responseDeadline: timestamp("response_deadline"),
  respondedAt: timestamp("responded_at"),
  responseType: text("response_type", { enum: ['accepted', 'cancelled', 'expired'] }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Logs
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").references(() => queueEntries.id),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ['sms', 'call'] }).default('sms'),
  status: text("status", { enum: ['sent', 'failed', 'pending'] }).notNull(),
  twilioSid: text("twilio_sid"),
  error: text("error"),
  sentAt: timestamp("sent_at"),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertQueueSchema = createInsertSchema(queueEntries).omit({ 
  id: true, 
  queueNumber: true, 
  createdAt: true, 
  updatedAt: true,
  calledAt: true,
  responseDeadline: true,
  respondedAt: true,
  responseType: true,
  notificationSent: true,
  notificationSentAt: true,
  notificationStatus: true
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type QueueEntry = typeof queueEntries.$inferSelect;
export type InsertQueueEntry = z.infer<typeof insertQueueSchema>;

export type Notification = typeof notifications.$inferSelect;

// Request Types
export type CreateQueueRequest = InsertQueueEntry;
export type UpdateQueueStatusRequest = { status: QueueEntry['status'] };
