import express from "express";
import {
  getOwnerProfile,
  uploadGymLogo,
  removeGymLogo,
  updateGymGstDetails,
  uploadTrainerPhoto,
  removeTrainerPhoto,
  addTrainerOwner,
  updateTrainerOwner,
  removeTrainerOwner,
  connectWhatsappAccount,
  disconnectWhatsappAccount,
  updateWhatsappAutomationSettings,
  sendBalanceReminder,
} from "../controllers/ownerController.js";
import {
  createOffer,
  listOffers,
  getAudienceCount,
  cancelOffer,
} from "../controllers/offerController.js";
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  deleteCurrentMembership,
  extendMembership,
  getDeletedMembers,
  restoreMember,
  permanentDeleteMember,
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
router.patch(
  "/gst-details",
  authMiddleware,
  roleMiddleware("owner"),
  updateGymGstDetails
);

// Trainer's own profile photo — trainer-only, separate from the gym logo.
router.patch(
  "/trainer-photo",
  authMiddleware,
  roleMiddleware("trainer"),
  upload.single("photo"),
  uploadTrainerPhoto
);
router.delete("/trainer-photo", authMiddleware, roleMiddleware("trainer"), removeTrainerPhoto);

// Owner managing their own gym's trainers (add / edit / remove).
// Owner-only — a trainer cannot manage other trainers.
router.post("/trainers", authMiddleware, roleMiddleware("owner"), addTrainerOwner);
router.put("/trainers/:trainerId", authMiddleware, roleMiddleware("owner"), updateTrainerOwner);
router.delete("/trainers/:trainerId", authMiddleware, roleMiddleware("owner"), removeTrainerOwner);

// ============ WHATSAPP AUTOMATION (owner-only, Plus/Pro gated in controller) ============

router.post("/whatsapp/connect", authMiddleware, roleMiddleware("owner"), connectWhatsappAccount);
router.delete("/whatsapp/connect", authMiddleware, roleMiddleware("owner"), disconnectWhatsappAccount);
router.patch(
  "/whatsapp/automation-settings",
  authMiddleware,
  roleMiddleware("owner"),
  updateWhatsappAutomationSettings
);
router.post(
  "/whatsapp/send-balance-reminder/:memberId",
  authMiddleware,
  roleMiddleware("owner"),
  sendBalanceReminder
);

// ============ OFFER BROADCASTS (owner-only, Plus/Pro gated in controller) ============

router.post("/whatsapp/offers", authMiddleware, roleMiddleware("owner"), createOffer);
router.get("/whatsapp/offers", authMiddleware, roleMiddleware("owner"), listOffers);
router.get(
  "/whatsapp/offers/audience-count",
  authMiddleware,
  roleMiddleware("owner"),
  getAudienceCount
);
router.delete("/whatsapp/offers/:id", authMiddleware, roleMiddleware("owner"), cancelOffer);

// ============ MEMBERS (owner + trainer — same gym data) ============

router.get("/members", authMiddleware, roleMiddleware("owner", "trainer"), getMembers);
router.post("/members", authMiddleware, roleMiddleware("owner", "trainer"), addMember);
router.put("/members/:id", authMiddleware, roleMiddleware("owner", "trainer"), updateMember);
router.delete("/members/:id", authMiddleware, roleMiddleware("owner", "trainer"), deleteMember);
// Deleted Members review — owner only, shown on the Owner Profile page.
router.get("/members/deleted", authMiddleware, roleMiddleware("owner"), getDeletedMembers);
router.patch("/members/:id/restore", authMiddleware, roleMiddleware("owner"), restoreMember);
router.delete("/members/:id/permanent", authMiddleware, roleMiddleware("owner"), permanentDeleteMember);
router.delete("/members/:id/current-membership", authMiddleware, roleMiddleware("owner", "trainer"), deleteCurrentMembership);
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