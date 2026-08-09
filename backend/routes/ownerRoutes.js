import express from "express";
import { getOwnerProfile, uploadGymLogo, removeGymLogo } from "../controllers/ownerController.js";
import {
  getInquiries,
  addInquiry,
  updateInquiry,
  deleteInquiry,
} from "../controllers/inquiryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// ============ OWNER PROFILE (owner only) ============

router.get("/profile", authMiddleware, roleMiddleware("owner"), getOwnerProfile);
router.patch(
  "/logo",
  authMiddleware,
  roleMiddleware("owner"),
  upload.single("gymLogo"),
  uploadGymLogo
);
router.delete("/logo", authMiddleware, roleMiddleware("owner"), removeGymLogo);

// ============ ENQUIRIES (owner + trainer — trainer uses the same Add flow) ============

router.get("/enquiries", authMiddleware, roleMiddleware("owner", "trainer"), getInquiries);
router.post("/enquiries", authMiddleware, roleMiddleware("owner", "trainer"), addInquiry);
router.put("/enquiries/:id", authMiddleware, roleMiddleware("owner", "trainer"), updateInquiry);
router.delete(
  "/enquiries/:id",
  authMiddleware,
  roleMiddleware("owner", "trainer"),
  deleteInquiry
);

export default router;