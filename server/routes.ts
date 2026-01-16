import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import twilio from "twilio"; 

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === AUTH SETUP ===
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cafe2020_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // === QUEUE ROUTES ===

  app.post(api.queue.create.path, async (req, res) => {
    try {
      const input = api.queue.create.input.parse(req.body);
      const entry = await storage.createQueueEntry(input);
      // Optional: Send "Joined" SMS here
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.queue.list.path, async (req, res) => {
    // In production, protect this: if (!req.isAuthenticated()) return res.sendStatus(401);
    const entries = await storage.getQueueEntries();
    res.json(entries);
  });

  app.get(api.queue.get.path, async (req, res) => {
    const entry = await storage.getQueueEntry(Number(req.params.id));
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json(entry);
  });

  app.get(api.queue.status.path, async (req, res) => {
    const entry = await storage.getQueueEntry(Number(req.params.id));
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json(entry);
  });

  // CALL CUSTOMER
  app.post(api.queue.call.path, async (req, res) => {
    const id = Number(req.params.id);
    let entry = await storage.getQueueEntry(id);
    if (!entry) return res.status(404).json({ message: "Not found" });

    // Update status and set timer
    const now = new Date();
    const deadline = new Date(now.getTime() + 10 * 60000); // 10 minutes

    entry = await storage.updateQueueEntry(id, {
      status: 'called',
      calledAt: now,
      responseDeadline: deadline,
      notificationSent: true, // Optimistic
    });

    // Send SMS via Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Hi ${entry.name}, your table is ready at Cafe 2020! Please accept here: ${process.env.PUBLIC_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/queue/${entry.id}/accept`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: entry.phoneNumber
        });
        await storage.logNotification({
          queueId: entry.id,
          phoneNumber: entry.phoneNumber,
          message: "Table ready notification",
          status: 'sent',
          type: 'sms',
          sentAt: new Date()
        });
      } catch (error: any) {
        console.error("Twilio Error:", error);
        await storage.logNotification({
          queueId: entry.id,
          phoneNumber: entry.phoneNumber,
          message: "Table ready notification",
          status: 'failed',
          type: 'sms',
          error: error.message
        });
      }
    }

    res.json(entry);
  });

  // CUSTOMER ACCEPT
  app.post(api.queue.accept.path, async (req, res) => {
    const id = Number(req.params.id);
    let entry = await storage.getQueueEntry(id);
    if (!entry) return res.status(404).json({ message: "Not found" });

    entry = await storage.updateQueueEntry(id, {
      status: 'confirmed',
      respondedAt: new Date(),
      responseType: 'accepted'
    });
    res.json(entry);
  });

  // CUSTOMER CANCEL
  app.post(api.queue.cancel.path, async (req, res) => {
    const id = Number(req.params.id);
    let entry = await storage.getQueueEntry(id);
    if (!entry) return res.status(404).json({ message: "Not found" });

    entry = await storage.updateQueueEntry(id, {
      status: 'cancelled',
      respondedAt: new Date(),
      responseType: 'cancelled'
    });
    res.json(entry);
  });

  // === SEED DATA ===
  if (process.env.NODE_ENV !== 'production') {
    const existing = await storage.getUserByUsername('admin');
    if (!existing) {
      const password = await hashPassword('admin123');
      await storage.createUser({ username: 'admin', password, role: 'admin' });
      console.log('Seeded admin user');
    }
  }

  return httpServer;
}
