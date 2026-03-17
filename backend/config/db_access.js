import mongoose from 'mongoose';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

export const dbConnection = async () => {
  try {
    const uri = process.env.MONGO_URI;

    console.log("DB URI exists:", !!uri);

    if (!uri) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(uri);

    console.log("Connected to database successfully!");
  } catch (error) {
    console.error("Error: " + error.message);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("Error while connecting to database! " + err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected!");
  });
};