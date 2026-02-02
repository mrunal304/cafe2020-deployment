import mongoose, { Schema, type Document } from "mongoose";

// Sample User Schema
export interface IUser extends Document {
  username: string;
  role: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  role: { type: String, default: "admin", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MongoUser = mongoose.model<IUser>("User", UserSchema);

// Sample Queue Schema
export interface IQueueEntry extends Document {
  name: string;
  phoneNumber: string;
  numberOfPeople: number;
  queueNumber: number;
  status: string;
  createdAt: Date;
}

const QueueEntrySchema: Schema = new Schema({
  name: { type: String, default: "Guest" },
  phoneNumber: { type: String, required: true },
  numberOfPeople: { type: String, required: true },
  queueNumber: { type: Number, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['waiting', 'called', 'confirmed', 'expired', 'cancelled', 'completed'],
    default: 'waiting',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
});

export const MongoQueueEntry = mongoose.model<IQueueEntry>("QueueEntry", QueueEntrySchema);
