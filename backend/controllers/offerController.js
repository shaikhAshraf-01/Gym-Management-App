import Gym from "../models/Gym.js";
import GymOffer from "../models/GymOffer.js";
import { resolveAudience } from "../utils/resolveAudience.js";
import { hasActivePlusOrProPlan } from "../utils/planCheck.js";
import { toFile } from "@imagekit/nodejs";
import imagekit from "../config/imagekit.js";
import { prepareWhatsappHeaderImage } from "../utils/compressImage.js";

const VALID_AUDIENCES = [
  "all_members",
  "active_members",
  "inactive_members",
  "all_members_and_enquiries",
];
const MAX_OFFER_NAME_LENGTH = 60;
const META_MAX_HEADER_IMAGE_BYTES = 5 * 1024 * 1024; // WhatsApp image header limit

const assertPlusOrProPlan = hasActivePlusOrProPlan;

// POST /api/owner/whatsapp/offers
export const createOffer = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    if (!(await assertPlusOrProPlan(gym._id))) {
      return res.status(403).json({
        success: false,
        message: "Offer Broadcasts are available on Plus and Pro plans only.",
      });
    }

    if (!gym.whatsappIntegration?.connected) {
      return res.status(400).json({
        success: false,
        message: "Connect your WhatsApp Business Account first.",
      });
    }

    const { templateName, offerName, scheduledDate, audience } = req.body;

    const cleanTemplateName = String(templateName || "").trim();
    // WhatsApp rejects template variables containing newlines/tabs or
    // 4+ consecutive spaces — collapse all whitespace to single spaces.
    const cleanOfferName = String(offerName || "").replace(/\s+/g, " ").trim();

    if (!cleanTemplateName || !cleanOfferName || !scheduledDate || !audience) {
      return res.status(400).json({
        success: false,
        message: "Template name, offer name, date, and audience are all required.",
      });
    }
    if (cleanOfferName.length > MAX_OFFER_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Offer name must be ${MAX_OFFER_NAME_LENGTH} characters or fewer.`,
      });
    }
    if (!VALID_AUDIENCES.includes(audience)) {
      return res.status(400).json({ success: false, message: "Invalid audience." });
    }
    const sendDate = new Date(scheduledDate);
    if (Number.isNaN(sendDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid send date." });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please attach the offer image (rate card).",
      });
    }

    // ---- Image: compress -> JPEG/PNG (Meta rule) -> host on ImageKit ----
    let prepared;
    try {
      prepared = await prepareWhatsappHeaderImage(req.file.buffer, req.file.originalname);
    } catch (imageError) {
      console.error("Offer image processing failed:", imageError?.message);
      return res.status(400).json({
        success: false,
        message: "Could not read this image. Please upload a JPG or PNG.",
      });
    }
    if (prepared.buffer.length > META_MAX_HEADER_IMAGE_BYTES) {
      return res.status(400).json({
        success: false,
        message: "Image is too large for WhatsApp (max 5 MB). Please use a smaller image.",
      });
    }

    const fileName = `offer-${gym._id}-${Date.now()}.${prepared.ext}`;
    const uploadableFile = await toFile(prepared.buffer, fileName, { type: prepared.mime });
    const uploaded = await imagekit.files.upload({
      file: uploadableFile,
      fileName,
      folder: "GymOpsFlow/offer-images",
      useUniqueFileName: true,
    });

    let offer;
    try {
      offer = await GymOffer.create({
        gym: gym._id,
        templateName: cleanTemplateName,
        offerName: cleanOfferName,
        imageUrl: uploaded.url,
        imageFileId: uploaded.fileId,
        scheduledDate: sendDate,
        audience,
        createdBy: req.user._id,
      });
    } catch (createError) {
      // Don't leave an orphaned image behind if the DB write failed.
      try {
        await imagekit.files.delete(uploaded.fileId);
      } catch (cleanupError) {
        console.error("ImageKit cleanup (offer image) failed:", cleanupError?.message);
      }
      throw createError;
    }

    return res.status(201).json({ success: true, message: "Offer scheduled.", offer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to schedule offer." });
  }
};

// GET /api/owner/whatsapp/offers
export const listOffers = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const offers = await GymOffer.find({ gym: gym._id }).sort({ scheduledDate: -1 });
    return res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch offers." });
  }
};

// GET /api/owner/whatsapp/offers/audience-count?audience=active_members
// Lets the frontend show "this will reach ~42 people" before scheduling.
export const getAudienceCount = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const { audience } = req.query;
    const recipients = await resolveAudience(gym._id, audience);
    return res.status(200).json({ success: true, count: recipients.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to count audience." });
  }
};

// DELETE /api/owner/whatsapp/offers/:id
export const cancelOffer = async (req, res) => {
  try {
    const gym = await Gym.findOne({ owner: req.user._id });
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const offer = await GymOffer.findOne({ _id: req.params.id, gym: gym._id });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }
    if (offer.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only a still-scheduled offer can be cancelled.",
      });
    }

    // The image is only needed to send — a cancelled offer never will,
    // so free the ImageKit storage.
    if (offer.imageFileId) {
      try {
        await imagekit.files.delete(offer.imageFileId);
      } catch (cleanupError) {
        console.error("ImageKit delete (cancelled offer image) failed:", cleanupError?.message);
      }
      offer.imageUrl = "";
      offer.imageFileId = "";
    }

    offer.status = "cancelled";
    await offer.save();

    return res.status(200).json({ success: true, message: "Offer cancelled.", offer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to cancel offer." });
  }
};