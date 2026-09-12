import User, { Trainer } from "../models/User.js";
import Gym from "../models/Gym.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";
import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";

import cloudinary from "../config/cloudinary.js"
import streamifier from "streamifier"
import { compressImageBuffer } from "../utils/compressImage.js";
import { emitToAdmins, emitToGym } from "../socket/index.js";
import { getFormattedTrainers } from "./gymController.js";
import { sendWhatsappTemplateMessage } from "../utils/sendWhatsappMessage.js";
// ================= GET OWNER / TRAINER PROFILE =================
// Originally owner-only. Now also serves Trainers (used by
// TrainerProfile.jsx) — a trainer has no gym logo/subscription
// management rights, but they still need read access to their own
// info + which gym they belong to. The owner lookup path below is
// UNCHANGED from before (still Gym.findOne({ owner: owner._id })) so
// existing owner behaviour has zero regression risk; trainer support
// is purely additive via a separate branch.

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
    
    const currentSubscription=await GymSubscriptionHistory.findOne({
        gymId:gym._id,
        endDate:{$gte:new Date()},
    }).sort({endDate:-1})

    // Trainer roster — needed on the Owner Profile page for the
    // add/edit/remove trainer section. Trainers themselves don't
    // need to see the roster on their own profile, so this stays
    // empty for the trainer branch.
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
      message: "Internal server error",    });
  }
};

// ================= UPDATE GST DETAILS =================
// Owner-only. GSTIN is optional — saving an empty string clears it,
// which switches every future receipt/invoice for this gym back to
// the plain (non-GST) format. Standard 15-character GSTIN format is
// validated when a non-empty value is sent.
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
const compressedBuffer = await compressImageBuffer(req.file.buffer);
// ...
    const uploadFromBuffer = () =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "GymOpsFlow/gym-logos",
            transformation: [
              {
                width: 500,
                height: 500,
                crop: "fill",     // image ko exactly 500x500 mein fill karega, bina distort kiye
                gravity: "auto",  // Cloudinary AI khud important part center mein rakhega
                quality: "auto",  // file size bhi optimize ho jayegi
                fetch_format: "auto",
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

streamifier.createReadStream(compressedBuffer).pipe(uploadStream); // req.file.buffer ki jagah
      });

      if(gym.gymLogoPublicId){
        await cloudinary.uploader.destroy(gym.gymLogoPublicId);
        gym.gymLogoPublicId="",
        gym.gymLogo=""
      }
    const result = await uploadFromBuffer();

    gym.gymLogo = result.secure_url;
    gym.gymLogoPublicId=result.public_id;
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
      message: "Internal server error.",    });
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

    // Delete image from Cloudinary
    if (gym.gymLogoPublicId) {
      await cloudinary.uploader.destroy(gym.gymLogoPublicId);
    }

    // Clear database fields
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
const compressedBuffer = await compressImageBuffer(req.file.buffer);
// ...
const uploadFromBuffer = () =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "GymOpsFlow/trainer-photos",
        transformation: [
          {
                width: 500,
                height: 500,
                crop: "fill",
                gravity: "center", // plain geometric center — no AI guessing, always predictable
                quality: "auto",
                fetch_format: "auto",
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        streamifier.createReadStream(compressedBuffer).pipe(uploadStream); // req.file.buffer ki jagah
      });

    if (trainer.photoPublicId) {
      await cloudinary.uploader.destroy(trainer.photoPublicId);
      trainer.photoPublicId = "";
      trainer.photo = "";
    }

    const result = await uploadFromBuffer();

    trainer.photo = result.secure_url;
    trainer.photoPublicId = result.public_id;
    await trainer.save();

    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully.",
      photo: trainer.photo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",    });
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
      await cloudinary.uploader.destroy(trainer.photoPublicId);
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
// Lets a gym owner manage their own trainers directly (previously
// only the admin could add/remove trainers). Scoped strictly to the
// gym the logged-in owner owns — an owner can never touch another
// gym's trainers, unlike the admin routes which take a gym :id from
// the URL.

const findOwnedGym = async (ownerId) => {
  const owner = await User.findById(ownerId);
  if (!owner || owner.role !== "owner") return { owner: null, gym: null };
  const gym = await Gym.findOne({ owner: owner._id });
  return { owner, gym };
};

// POST /api/owner/trainers
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

    // Realtime: the owner's other devices/tabs, any trainer already
    // signed in for this gym, and every admin session all stay in
    // sync without a manual refresh.
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

// PUT /api/owner/trainers/:trainerId
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

// DELETE /api/owner/trainers/:trainerId
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
      await cloudinary.uploader.destroy(trainer.photoPublicId);
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
// The gym owner connects THEIR OWN WhatsApp Business Account (via
// Meta's Embedded Signup on the frontend, which hands back a
// phoneNumberId/wabaId/accessToken). We never own the number — we
// just store the credentials to send template messages on the
// owner's behalf. Plan gating is enforced here, server-side, not
// just hidden in the UI, since a Basic-plan request could otherwise
// hit this endpoint directly.

const PLANS_WITH_WHATSAPP_AUTOMATION = ["Plus", "Pro"];

const assertPlusOrProPlan = async (gymId) => {
  const activeSub = await GymSubscriptionHistory.findOne({
    gymId,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  return (
    !!activeSub &&
    PLANS_WITH_WHATSAPP_AUTOMATION.includes(activeSub.subscriptionPlan)
  );
};

// POST /api/owner/whatsapp/connect
// Called after the frontend completes Meta's Embedded Signup flow.
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
      accessToken, // select:false — never sent back in responses
      connectedAt: new Date(),
    };
    await gym.save();

    const safeGym = await Gym.findById(gym._id); // re-fetch, drops accessToken (select:false)

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

// DELETE /api/owner/whatsapp/connect
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
    // Automation can't run without a connected account.
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

// PATCH /api/owner/whatsapp/automation-settings
// Accepts a partial settings object and merges it in, e.g.:
// { enabled: true } or { expiryReminder: { enabled: true, daysBefore: 5 } }
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

    // Shallow-merge each known sub-section so a partial update (e.g.
    // just { expiryReminder: { daysBefore: 5 } }) doesn't wipe the
    // other fields already saved for that sub-section.
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
      balanceReminder: { ...current.balanceReminder, ...(incoming.balanceReminder || {}) },
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

// POST /api/owner/whatsapp/send-balance-reminder/:memberId
// Manual, on-demand trigger — owner taps "Send Reminder" next to a
// member with a pending balance in the Members list. Requires the
// balanceReminder automation to be turned on (which just unlocks this
// button; it doesn't run on its own schedule).
export const sendBalanceReminder = async (req, res) => {
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

    if (!gym.whatsappAutomationSettings?.balanceReminder?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Turn on Balance Reminder in Manage WhatsApp first.",
      });
    }

    const member = await Member.findOne({ _id: req.params.memberId, gym: gym._id });
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }

    const latestSub = await MemberSubscriptionHistory.findOne({ member: member._id }).sort({
      expiryDate: -1,
    });
    const balance = Number(latestSub?.balance || 0);
    if (balance <= 0) {
      return res.status(400).json({
        success: false,
        message: "This member has no pending balance.",
      });
    }

    // Re-fetch the gym with the access token included — findOwnedGym's
    // result above has it stripped (select:false).
    const gymWithToken = await Gym.findById(gym._id).select(
      "+whatsappIntegration.accessToken"
    );

    const result = await sendWhatsappTemplateMessage({
      gym: gymWithToken,
      toPhone: member.mobile,
      templateName: gym.whatsappAutomationSettings.balanceReminder.templateName,
      templateParams: [member.name, String(balance), gym.gymName],
    });

    if (!result.success) {
      return res.status(502).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      message: "Balance reminder sent.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send balance reminder.",
    });
  }
};

// POST /api/owner/whatsapp/test-send
// Owner-triggered dry run — sends ONE real message, straight from the
// app, using whatever template name is currently saved for the given
// automation, filled with realistic sample values (not a real
// member). Lets the owner confirm a freshly-approved Meta template
// actually delivers before it goes live on the real cron/triggers.
const TEST_SAMPLE_PARAMS = {
  expiryReminder: (gym, settings) => [
    "Test Member",
    String(settings.expiryReminder?.daysBefore || 3),
  ],
  memberWelcome: (gym) => ["Test Member", "Monthly"],
  extendRenewal: (gym) => ["Test Member", "Monthly", "Renewed"],
  balanceConfirmation: (gym) => ["Test Member", "0", gym.gymName],
  balanceReminder: (gym) => ["Test Member", "500", gym.gymName],
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

    // Re-fetch with the access token included — findOwnedGym's result
    // above has it stripped (select:false).
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