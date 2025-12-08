import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- 1. Fungsi Koneksi Database (Agar tidak connect ulang terus) ---
let isConnected = false; // Track status koneksi

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
    throw err; // Lempar error agar Vercel tahu ada masalah
  }
};

// --- 2. Konfigurasi untuk Vercel (Serverless) ---
// Vercel membutuhkan kita untuk men-export handler function, bukan menjalankan app.listen
export default async function handler(req, res) {
  // Pastikan DB connect dulu sebelum memproses request
  await connectToDatabase();
  
  // Teruskan request ke Express App
  return app(req, res);
}

// --- 3. Konfigurasi untuk Localhost (Laptop) ---
// Kode ini hanya jalan kalau file ini dijalankan langsung (bukan diimport oleh Vercel)
// Cek apakah kita sedang di environment Vercel atau tidak
if (process.env.NODE_ENV !== 'production') {
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running locally on port ${PORT} 🚀`);
        });
    });
}