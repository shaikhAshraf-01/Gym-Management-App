import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  getAdminProfile,
  changeAdminPassword,
} from "../controllers/adminController.js";
import{
  createGym
} from "../controllers/gymController.js"

const router = express.Router();

// ===== Profile =====
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminProfile
);

router.patch(
  "/change-password",
  authMiddleware,
  roleMiddleware("admin"),
  changeAdminPassword
);

//===== Gym Management =====
router.post(
  "/createGyms",
  authMiddleware,
  roleMiddleware("admin"),
  createGym
);
export default router;