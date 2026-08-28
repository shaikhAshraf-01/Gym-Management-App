import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js"
connectDB();
const app=express();
app.set("trust proxy", 1);

// Basic HTTP security headers (clickjacking, MIME-sniffing, etc.)
app.use(helmet());

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
app.use(cookieParser());

// Strips MongoDB operator keys ($ne, $gt, etc.) out of req.body/query/params
// so a crafted field (e.g. { "mobile": { "$ne": null } }) can't be used to
// bypass a findOne() filter — a classic NoSQL injection technique.
app.use(mongoSanitize());

// Login/OTP endpoints get their own stricter limiter, applied at the
// route level in authRoutes.js (so /me and /logout — called far more
// often during normal use — aren't caught by that stricter cap).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", generalLimiter, authRoutes);
app.use("/api/admin", generalLimiter, adminRoutes);
app.use("/api/owner", generalLimiter, ownerRoutes);

//for render to stay active
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
// Any route that isn't matched above (typo'd endpoint, old frontend
// build hitting a removed route, etc.)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Last-resort safety net for anything that slips past a controller's
// own try/catch.
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
const PORT = process.env.PORT || 5000;

// socket.io needs the raw http server (it hooks into the HTTP
// upgrade event for the websocket handshake) — express's app.listen()
// creates one internally but doesn't expose it, so we create it
// ourselves and hand it to both express and socket.io.
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});