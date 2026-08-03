import mongoose from "mongoose";
import { Admin } from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const adminExists = await Admin.findOne({ role: "admin" });

if (!adminExists) {
  await Admin.create({
    name: "Super Admin",
    mobile: "9172001155",
    email: "ashrafshaikh@gmail.com",
    password: "@Ashraf5683",
  });

  console.log("Admin created");
} else {
  console.log("Admin already exists");
}

process.exit();