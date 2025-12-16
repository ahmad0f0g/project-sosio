import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

let isConnected = false; 

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected ✔️");
  } catch (err) {
    console.error("MongoDB error ❌:", err);
    throw err; 
  }
};

export default async function handler(req, res) {
  await connectToDatabase();
  
  return app(req, res);
}


if (process.env.NODE_ENV !== 'production') {
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running locally on port ${PORT} 🚀`);
        });
    });
}