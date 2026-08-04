import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  getAdminProfile,
  changeAdminPassword,
//   getDashboard,
//   createGym,
//   getAllGyms,
//   getGymById,
//   updateGym,
//   updateGymStatus,
} from "../controllers/adminController.js";

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

// ===== Dashboard =====
// router.get(
//   "/dashboard",
//   authMiddleware,
//   roleMiddleware("admin"),
//   getDashboard
// );

// ===== Gym Management =====
// router.post(
//   "/gyms",
//   authMiddleware,
//   roleMiddleware("admin"),
//   createGym
// );

// router.get(
//   "/gyms",
//   authMiddleware,
//   roleMiddleware("admin"),
//   getAllGyms
// );

// router.get(
//   "/gyms/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   getGymById
// );

// router.put(
//   "/gyms/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   updateGym
// );

// router.patch(
//   "/gyms/:id/status",
//   authMiddleware,
//   roleMiddleware("admin"),
//   updateGymStatus
// );

export default router;