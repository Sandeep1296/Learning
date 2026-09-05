import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");

let cached = (global as any).mongoose || { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) {
    console.log('MongoDB: using cached connection');
    return cached.conn;
  }
  if (!cached.promise) {
    console.log('MongoDB: establishing new connection');
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((m) => {
        console.log('MongoDB: connection successful');
        return m;
      })
      .catch((err) => {
        console.error('MongoDB: connection error', err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
