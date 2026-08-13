import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js"
connectDB();
const app=express();

// Purani line ko hata kar yeh lagayein:
const allowedOrigins = [
  process.env.CLIENT_ORIGIN, // Aapki purani website ka URL (jo .env me hai)
  "http://localhost",        // 👈 Android Mobile App ke liye
  "capacitor://localhost"    // 👈 Capacitor/iOS ke liye
];

app.use(cors({
  origin: function (origin, callback) {
    // Agar request mobile app se hai toh origin undefined ya localhost hoga
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner",ownerRoutes);

//for render to stay active
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
