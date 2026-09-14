import User, { Trainer } from "../models/User.js";
import Gym from "../models/Gym.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";
import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";

import { toFile } from "@imagekit/nodejs";
import imagekit from "../config/imagekit.js";
import { compressImageBuffer } from "../utils/compressImage.js";
import { emitToAdmins, emitToGym } from "../socket/index.js";
import { hasActivePlusOrProPlan } from "../utils/planCheck.js";
import { getFormattedTrainers } from "./gymController.js";
import { sendWhatsappTemplateMessage } from "../utils/sendWhatsappMessage.js";

// Helper function to extract file extension safely
const getFileExtension = (originalname) => {
  if (!originalname) return "jpg";
  const ext = originalname.split(".").pop().toLowerCase();
  return ext ? ext : "jpg";
};

// Mirrors compressImageBuffer's own format branching (utils/compressImage.js)
// so the mime type we tell ImageKit always matches what sharp actually output.
const getCompressedMimeType = (fileExt) => {
  const ext = fileExt?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "image/jpeg"; // compressImageBuffer's fallback for everything else
};

// ================= GET OWNER / TRAINER PROFILE =================
export const getOwnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp -otpExpires");

    if (!user || (user.role !== "owner" && user.role !== "trainer")) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const gym =
      user.role === "owner"
        ? await Gym.findOne({ owner: user._id })
        : await Gym.findById(user.gymId);

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }
    
    const currentSubscription = await GymSubscriptionHistory.findOne({
      gymId: gym._id,
      endDate: { $gte: new Date() },
    }).sort({ endDate: -1 });

    const trainers =
      user.role === "owner" ? await getFormattedTrainers(gym._id) : [];

    return res.status(200).json({
      success: true,
      owner: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        photo: user.photo,
        role: user.role,
      },
      gym,
      currentSubscription,
      trainers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= UPDATE GST DETAILS =================
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const updateGymGstDetails = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id);

    if (!owner || owner.role !== "owner") {
      return res.status(404).json({
        success: false,
        message: "Owner not found.",
      });
    }

    const gym = await Gym.findOne({ owner: owner._id });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const gstNumber = String(req.body.gstNumber || "").trim().toUpperCase();

    if (gstNumber && !GSTIN_REGEX.test(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: "That doesn't look like a valid 15-character GSTIN.",
      });
    }

    gym.gstNumber = gstNumber;
    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: gstNumber ? "GST details saved." : "GST details removed.",
      gym,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// ================= UPLOAD GYM LOGO =================
export const uploadGymLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const owner = await User.findById(req.user._id);

    if (!owner || owner.role !== "owner") {
      return res.status(404).json({
        success: false,
        message: "Owner not found.",
      });
    }

    const gym = await Gym.findOne({ owner: owner._id });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    // Original extension extract karein
    const fileExt = getFileExtension(req.file.originalname);

    // Dynamic extension ke saath image compress karein
    const compressedBuffer = await compressImageBuffer(req.file.buffer, fileExt);

    const uploadFromBuffer = async () => {
      const fileName = `gym-logo-${gym._id}.${fileExt}`;
      const uploadableFile = await toFile(compressedBuffer, fileName, {
        type: getCompressedMimeType(fileExt),
      });
      const result = await imagekit.files.upload({
        file: uploadableFile,
        fileName, // Dynamic Extension
        folder: "GymOpsFlow/gym-logos",
        useUniqueFileName: true,
        transformation: {
          pre: "w-500,h-500,fo-auto",
        },
      });
      return result;
    };

    if (gym.gymLogoPublicId) {
      try {
        await imagekit.files.delete(gym.gymLogoPublicId);
      } catch (error) {
        console.error("ImageKit delete (old gym logo) failed:", error?.message);
      }
      gym.gymLogoPublicId = "";
      gym.gymLogo = "";
    }

    const result = await uploadFromBuffer();

    gym.gymLogo = result.url;
    gym.gymLogoPublicId = result.fileId;
    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: "Gym logo uploaded successfully.",
      gymLogo: gym.gymLogo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const removeGymLogo = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id);

    if (!owner || owner.role !== "owner") {
      return res.status(404).json({
        success: false,
        message: "Owner not found.",
      });
    }

    const gym = await Gym.findOne({ owner: owner._id });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    if (gym.gymLogoPublicId) {
      try {
        await imagekit.files.delete(gym.gymLogoPublicId);
      } catch (error) {
        console.error("ImageKit delete (gym logo) failed:", error?.message);
      }
    }

    gym.gymLogo = "";
    gym.gymLogoPublicId = "";

    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: "Gym logo removed successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= TRAINER PROFILE PHOTO =================
export const uploadTrainerPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const trainer = await User.findById(req.user._id);

    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    // Original extension extract karein
    const fileExt = getFileExtension(req.file.originalname);

    // Dynamic extension ke saath image compress karein
    const compressedBuffer = await compressImageBuffer(req.file.buffer, fileExt);

    const uploadFromBuffer = async () => {
      const fileName = `trainer-photo-${trainer._id}.${fileExt}`;
      const uploadableFile = await toFile(compressedBuffer, fileName, {
        type: getCompressedMimeType(fileExt),
      });
      const result = await imagekit.files.upload({
        file: uploadableFile,
        fileName, // Dynamic Extension
        folder: "GymOpsFlow/trainer-photos",
        useUniqueFileName: true,
        transformation: {
          pre: "w-500,h-500",
        },
      });
      return result;
    };

    if (trainer.photoPublicId) {
      try {
        await imagekit.files.delete(trainer.photoPublicId);
      } catch (error) {
        console.error("ImageKit delete (old trainer photo) failed:", error?.message);
      }
      trainer.photoPublicId = "";
      trainer.photo = "";
    }

    const result = await uploadFromBuffer();

    trainer.photo = result.url;
    trainer.photoPublicId = result.fileId;
    await trainer.save();

    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully.",
      photo: trainer.photo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const removeTrainerPhoto = async (req, res) => {
  try {
    const trainer = await User.findById(req.user._id);

    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    if (trainer.photoPublicId) {
      try {
        await imagekit.files.delete(trainer.photoPublicId);
      } catch (error) {
        console.error("ImageKit delete (trainer photo) failed:", error?.message);
      }
    }

    trainer.photo = "";
    trainer.photoPublicId = "";
    await trainer.save();

    return res.status(200).json({
      success: true,
      message: "Photo removed successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= OWNER: TRAINER MANAGEMENT =================
const findOwnedGym = async (ownerId) => {
  const owner = await User.findById(ownerId);
  if (!owner || owner.role !== "owner") return { owner: null, gym: null };
  const gym = await Gym.findOne({ owner: owner._id });
  return { owner, gym };
};

export const addTrainerOwner = async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    if (!name || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required trainer fields.",
      });
    }

    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ mobile }, { email: email.toLowerCase() }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this mobile number or email already exists.",
      });
    }

    await Trainer.create({
      name,
      mobile,
      email: email.toLowerCase(),
      gymId: gym._id,
    });

    const trainers = await getFormattedTrainers(gym._id);

    emitToGym(gym._id, "trainers:updated", { gymId: gym._id, trainers });
    emitToAdmins("trainers:updated", { gymId: gym._id, trainers });

    return res.status(201).json({
      success: true,
      message: "Trainer added successfully.",
      trainers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add trainer.",
    });
  }
};

export const updateTrainerOwner = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { name, mobile, email } = req.body;

    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const trainer = await Trainer.findOne({ _id: trainerId, gymId: gym._id });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found for this gym.",
      });
    }

    if (mobile !== undefined || email !== undefined) {
      const existingUser = await User.findOne({
        _id: { $ne: trainer._id },
        $or: [
          ...(mobile !== undefined ? [{ mobile }] : []),
          ...(email !== undefined ? [{ email: email.toLowerCase() }] : []),
        ],
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this mobile number or email already exists.",
        });
      }
    }

    if (name !== undefined) trainer.name = name;
    if (mobile !== undefined) trainer.mobile = mobile;
    if (email !== undefined) trainer.email = email.toLowerCase();

    await trainer.save();

    const trainers = await getFormattedTrainers(gym._id);

    emitToGym(gym._id, "trainers:updated", { gymId: gym._id, trainers });
    emitToAdmins("trainers:updated", { gymId: gym._id, trainers });

    return res.status(200).json({
      success: true,
      message: "Trainer updated successfully.",
      trainers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update trainer.",
    });
  }
};

export const removeTrainerOwner = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const trainer = await Trainer.findOne({ _id: trainerId, gymId: gym._id });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found for this gym.",
      });
    }

    if (trainer.photoPublicId) {
      try {
        await imagekit.files.delete(trainer.photoPublicId);
      } catch (error) {
        console.error("ImageKit delete (deleted trainer's photo) failed:", error?.message);
      }
    }

    await Trainer.findByIdAndDelete(trainerId);

    const trainers = await getFormattedTrainers(gym._id);

    emitToGym(gym._id, "trainers:updated", { gymId: gym._id, trainers });
    emitToAdmins("trainers:updated", { gymId: gym._id, trainers });

    return res.status(200).json({
      success: true,
      message: "Trainer removed successfully.",
      trainers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove trainer.",
    });
  }
};

// ================= WHATSAPP AUTOMATION (Plus / Pro only) =================
const assertPlusOrProPlan = hasActivePlusOrProPlan;

export const connectWhatsappAccount = async (req, res) => {
  try {
    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    if (!(await assertPlusOrProPlan(gym._id))) {
      return res.status(403).json({
        success: false,
        message: "WhatsApp automation is available on Plus and Pro plans only.",
      });
    }

    const { phoneNumberId, wabaId, accessToken } = req.body;
    if (!phoneNumberId || !wabaId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Missing WhatsApp account details from Meta.",
      });
    }

    gym.whatsappIntegration = {
      connected: true,
      phoneNumberId,
      wabaId,
      accessToken,
      connectedAt: new Date(),
    };
    await gym.save();

    const safeGym = await Gym.findById(gym._id);

    emitToGym(gym._id, "gym:updated", { gym: safeGym });
    emitToAdmins("gym:updated", { gym: safeGym });

    return res.status(200).json({
      success: true,
      message: "WhatsApp Business Account connected.",
      gym: safeGym,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to connect WhatsApp account.",
    });
  }
};

export const disconnectWhatsappAccount = async (req, res) => {
  try {
    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    gym.whatsappIntegration = {
      connected: false,
      phoneNumberId: "",
      wabaId: "",
      accessToken: "",
      connectedAt: null,
    };
    gym.whatsappAutomationSettings.enabled = false;
    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: "WhatsApp Business Account disconnected.",
      gym,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect WhatsApp account.",
    });
  }
};

export const updateWhatsappAutomationSettings = async (req, res) => {
  try {
    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    if (!(await assertPlusOrProPlan(gym._id))) {
      return res.status(403).json({
        success: false,
        message: "WhatsApp automation is available on Plus and Pro plans only.",
      });
    }

    if (typeof req.body.enabled === "boolean" && req.body.enabled && !gym.whatsappIntegration?.connected) {
      return res.status(400).json({
        success: false,
        message: "Connect your WhatsApp Business Account before enabling automation.",
      });
    }

    const current = gym.whatsappAutomationSettings.toObject();
    const incoming = req.body || {};

    gym.whatsappAutomationSettings = {
      enabled:
        typeof incoming.enabled === "boolean" ? incoming.enabled : current.enabled,
      expiryReminder: { ...current.expiryReminder, ...(incoming.expiryReminder || {}) },
      memberWelcome: { ...current.memberWelcome, ...(incoming.memberWelcome || {}) },
      extendRenewal: { ...current.extendRenewal, ...(incoming.extendRenewal || {}) },
      balanceConfirmation: {
        ...current.balanceConfirmation,
        ...(incoming.balanceConfirmation || {}),
      },
    };
    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: "WhatsApp automation settings saved.",
      gym,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save WhatsApp automation settings.",
    });
  }
};

// ================= PRICING MANAGEMENT =================
const ALLOWED_DURATION_KEYS = ["1_month", "3_month", "6_month", "1_year"];

const validateDurationPrices = (prices, label) => {
  const cleaned = {};
  for (const key of ALLOWED_DURATION_KEYS) {
    const amount = Number(prices?.[key] ?? 0);
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: `Invalid ${key} price for ${label}.` };
    }
    cleaned[key] = amount;
  }
  return { cleaned };
};

export const updateGymPricing = async (req, res) => {
  try {
    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    const { plans, activities, offers } = req.body || {};

    if (plans && typeof plans === "object") {
      const { cleaned, error } = validateDurationPrices(plans, "the plan");
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }
      gym.pricing.plans = { ...gym.pricing.plans, ...cleaned };
    }

    if (Array.isArray(activities)) {
      const cleanedActivities = [];
      for (const activity of activities) {
        const name = String(activity?.name || "").trim();
        if (!name) {
          return res.status(400).json({
            success: false,
            message: "Every activity needs a name.",
          });
        }
        const { cleaned, error } = validateDurationPrices(
          activity?.prices,
          name
        );
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
        cleanedActivities.push({ name, prices: cleaned });
      }
      gym.pricing.activities = cleanedActivities;
    }

    if (Array.isArray(offers)) {
      const cleanedOffers = [];
      for (const offer of offers) {
        const name = String(offer?.name || "").trim();
        if (!name) {
          return res.status(400).json({
            success: false,
            message: "Every offer needs a name.",
          });
        }
        const { cleaned, error } = validateDurationPrices(offer?.plans, name);
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
        cleanedOffers.push({
          name,
          active: offer?.active !== false,
          plans: cleaned,
        });
      }
      gym.pricing.offers = cleanedOffers;
    }

    await gym.save();

    emitToGym(gym._id, "gym:updated", { gym });
    emitToAdmins("gym:updated", { gym });

    return res.status(200).json({
      success: true,
      message: "Pricing saved.",
      gym,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save pricing.",
    });
  }
};

// ================= TEST SEND WHATSAPP AUTOMATION =================
const TEST_SAMPLE_PARAMS = {
  expiryReminder: (gym, settings) => [
    "Test Member",
    String(settings.expiryReminder?.daysBefore || 3),
  ],
  memberWelcome: (gym) => ["Test Member", "Monthly"],
  extendRenewal: (gym) => ["Test Member", "Monthly", "Renewed"],
  balanceConfirmation: (gym) => ["Test Member"],
};

export const testSendWhatsappAutomation = async (req, res) => {
  try {
    const { automation, toPhone } = req.body;

    if (!TEST_SAMPLE_PARAMS[automation]) {
      return res.status(400).json({
        success: false,
        message: "Unknown automation type.",
      });
    }

    const cleanPhone = String(toPhone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number to test with.",
      });
    }

    const { gym } = await findOwnedGym(req.user._id);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found." });
    }

    if (!(await assertPlusOrProPlan(gym._id))) {
      return res.status(403).json({
        success: false,
        message: "WhatsApp automation is available on Plus and Pro plans only.",
      });
    }

    if (!gym.whatsappIntegration?.connected) {
      return res.status(400).json({
        success: false,
        message: "Connect your WhatsApp Business Account first.",
      });
    }

    const templateName = gym.whatsappAutomationSettings?.[automation]?.templateName;
    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: "Save a template name for this automation before testing it.",
      });
    }

    const gymWithToken = await Gym.findById(gym._id).select(
      "+whatsappIntegration.accessToken"
    );

    const result = await sendWhatsappTemplateMessage({
      gym: gymWithToken,
      toPhone: cleanPhone,
      templateName,
      templateParams: TEST_SAMPLE_PARAMS[automation](gym, gym.whatsappAutomationSettings),
    });

    if (!result.success) {
      return res.status(502).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      message: `Test "${automation}" message sent using template "${templateName}".`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test message.",
    });
  }
};