import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  getAdminProfile,
  changeAdminPassword,
  getPlanPricing,
  updatePlanPricing,
} from "../controllers/adminController.js";
import{
  createGym,
  getAllGyms,
  updateGym,
  deleteGym,
  addTrainer,
  deleteTrainer,
} from "../controllers/gymController.js"

import {
  getGymOverview,
  getGymMembers,
  getGymEnquiries,
  getGymSales,
} from "../controllers/adminGymViewController.js";

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

//====All gyms details
router.get("/gyms",
  authMiddleware,
  roleMiddleware("admin"),
  getAllGyms
)

router.put("/gyms/:id",authMiddleware,roleMiddleware("admin"),updateGym)
router.delete("/gyms/:id",authMiddleware,roleMiddleware("admin"),deleteGym)

//===== Trainer Management =====
router.post(
  "/gyms/:id/trainers",
  authMiddleware,
  roleMiddleware("admin"),
  addTrainer
)

router.delete(
  "/gyms/:id/trainers/:trainerId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteTrainer
)

// ===== Gym View (read-only: overview, members, enquiries, sales) =====
router.get("/gyms/:id/overview", authMiddleware, roleMiddleware("admin"), getGymOverview);
router.get("/gyms/:id/members", authMiddleware, roleMiddleware("admin"), getGymMembers);
router.get("/gyms/:id/enquiries", authMiddleware, roleMiddleware("admin"), getGymEnquiries);
router.get("/gyms/:id/sales", authMiddleware, roleMiddleware("admin"), getGymSales);

// ===== Plan Pricing (Basic/Plus/Pro subscription pricing sold to
// gym owners — not a gym's own member fees) =====
router.get(
  "/plan-pricing",
  authMiddleware,
  roleMiddleware("admin"),
  getPlanPricing
);

router.patch(
  "/plan-pricing",
  authMiddleware,
  roleMiddleware("admin"),
  updatePlanPricing
);

export default router;