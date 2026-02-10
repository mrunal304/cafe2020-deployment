# Cafe Twenty Twenty Queue Management System

## Overview

A full-stack queue management system for Cafe Twenty Twenty featuring QR code entry, real-time notifications, SMS integration via Twilio, and time-based table acceptance logic. Customers can join a queue, receive SMS notifications when called, and have 10 minutes to accept their table before the booking expires.

The system has two main interfaces:
- **Customer-facing pages**: Mobile-first design for joining queues, viewing status, and accepting/declining table calls
- **Admin dashboard**: Desktop-optimized interface for managing queue entries, calling customers, and monitoring status

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and HMR
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state, caching, and real-time polling
- **Styling**: Tailwind CSS with custom "Warm Cafe" theme (Orange #FF9933 primary, Beige #F5E6D3 background)
- **UI Components**: Shadcn UI (New York style) with Radix primitives
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Passport.js with local strategy, express-session for session management
- **Password Hashing**: scrypt with random salt

### Data Layer
- **Database**: MongoDB via Mongoose ODM
- **Connection**: `server/mongodb.ts` handles connection using `MONGODB_URI` environment variable
- **Storage**: `server/storage.ts` implements data access layer

### Key Data Models
- **Users**: Admin accounts with username/password authentication
- **Queue Entries**: Customer bookings with status tracking (waiting → called → confirmed/expired/cancelled)
  - `dailySerialNumber`: Sequential number for all bookings per date (1, 2, 3...)
  - `activeQueuePosition`: Real-time waiting position for customer display
  - `bookingDate`: Date-only field for daily grouping
  - `bookingDateTime`: Full timestamp of the booking
- **Notifications**: SMS/call logs with Twilio integration tracking

### Real-time Features
- Customer status pages poll every 5 seconds for queue updates
- 10-minute countdown timer for table acceptance after being called
- Automatic status transitions on expiry

### Build System
- Development: `tsx` for TypeScript execution
- Production: esbuild for server bundling, Vite for client bundling
- Output: `dist/` directory with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### Database
- **MongoDB**: Primary data store, connection via `MONGODB_URI` environment variable
- **Mongoose**: ODM for schema definition and data access

### SMS/Notifications
- **Twilio**: SMS notifications when customers are called
  - Required env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Authentication
- **express-session**: Session management
- **passport / passport-local**: Local authentication strategy
- Required env var: `SESSION_SECRET`

### Development Tools
- **Replit plugins**: Runtime error overlay, cartographer, dev banner (development only)

### Required Environment Variables
```
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your_session_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```