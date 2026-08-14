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

const allowedOrigins = [
  process.env.CLIENT_ORIGIN, // Aapki website ka URL
  "http://localhost",        // Android local server
  "capacitor://localhost",    // iOS/Android webview
  "file://"                  // File protocol local fallback
];

app.use(cors({
  origin: function (origin, callback) {
    // Agar mobile app se request hai toh origin undefined hota hai, ya fir usme localhost/capacitor/file keyword hota hai
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      origin.includes('localhost') || 
      origin.includes('capacitor://') || 
      origin.includes('file://')
    ) {
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
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
