import express from "express";
import { getOwnerProfile, uploadGymLogo } from "../controllers/ownerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// GET Owner Profile
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("owner"),
  getOwnerProfile
);
router.patch(
  "/logo",
  authMiddleware,
    roleMiddleware("owner"),

  upload.single("gymLogo"),
  uploadGymLogo,
)
export default router;