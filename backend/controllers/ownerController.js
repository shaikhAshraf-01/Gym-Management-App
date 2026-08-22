import User from "../models/User.js";
import Gym from "../models/Gym.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";

import cloudinary from "../config/cloudinary.js"
import streamifier from "streamifier"
import { compressImageBuffer } from "../utils/compressImage.js";
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
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",    });
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