import express from "express";
import { verifyWhatsAppWebhook, receiveWhatsAppEvent } from "../controllers/whatsappController.js";

const router = express.Router();

// No authMiddleware here — Meta hits this directly, there's no user
// token to check. Verification/security comes from WHATSAPP_VERIFY_TOKEN
// (handshake) and, later, from validating Meta's X-Hub-Signature-256
// header on POSTs if we want extra hardening.
router.get("/", verifyWhatsAppWebhook);
router.post("/", receiveWhatsAppEvent);

export default router;