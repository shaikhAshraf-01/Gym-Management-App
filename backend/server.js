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

app.use(cors({origin: process.env.CLIENT_ORIGIN, credentials:true}));
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
