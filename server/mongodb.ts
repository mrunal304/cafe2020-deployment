import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

export async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB successfully");

    // Drop stale queueNumber_1 unique index if it exists (legacy schema remnant)
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collection = db.collection("queueentries");
        const indexes = await collection.indexes();
        const hasStaleIndex = indexes.some((idx: any) => idx.name === "queueNumber_1");
        if (hasStaleIndex) {
          await collection.dropIndex("queueNumber_1");
          console.log("Dropped stale queueNumber_1 index from queueentries");
        }
      }
    } catch (indexErr) {
      console.warn("Could not clean up stale index (non-fatal):", indexErr);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
