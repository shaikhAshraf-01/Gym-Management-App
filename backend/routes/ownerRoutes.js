import express from "express";
import { getOwnerProfile, uploadGymLogo, removeGymLogo, uploadTrainerPhoto, removeTrainerPhoto } from "../controllers/ownerController.js";
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  extendMembership,
} from "../controllers/memberController.js";
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

// ============ PROFILE ============
// GET /profile: owner AND trainer (trainer needs read access to their
// own info + gym they belong to — see TrainerProfile.jsx).
// Logo management stays owner-only.

router.get("/profile", authMiddleware, roleMiddleware("owner", "trainer"), getOwnerProfile);
router.patch(
  "/logo",
  authMiddleware,
  roleMiddleware("owner"),
  upload.single("gymLogo"),
  uploadGymLogo
);
router.delete("/logo", authMiddleware, roleMiddleware("owner"), removeGymLogo);

// Trainer's own profile photo — trainer-only, separate from the gym logo.
router.patch(
  "/trainer-photo",
  authMiddleware,
  roleMiddleware("trainer"),
  upload.single("photo"),
  uploadTrainerPhoto
);
router.delete("/trainer-photo", authMiddleware, roleMiddleware("trainer"), removeTrainerPhoto);

// ============ MEMBERS (owner + trainer — same gym data) ============

router.get("/members", authMiddleware, roleMiddleware("owner", "trainer"), getMembers);
router.post("/members", authMiddleware, roleMiddleware("owner", "trainer"), addMember);
router.put("/members/:id", authMiddleware, roleMiddleware("owner", "trainer"), updateMember);
router.delete("/members/:id", authMiddleware, roleMiddleware("owner", "trainer"), deleteMember);
router.post(
  "/members/:id/extend",
  authMiddleware,
  roleMiddleware("owner", "trainer"),
  extendMembership
);

// ============ ENQUIRIES (owner + trainer) ============

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