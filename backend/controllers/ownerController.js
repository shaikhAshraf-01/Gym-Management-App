import User from "../models/User.js";
import Gym from "../models/Gym.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";

import cloudinary from "../config/cloudinary.js"
import streamifier from "streamifier"
// ================= GET OWNER PROFILE =================

export const getOwnerProfile = async (req, res) => {
  try {
    const owner = await User.findById(req.user._id).select("-password -otp -otpExpires");

    if (!owner || owner.role !== "owner") {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    const gym = await Gym.findOne({ owner: owner._id });
    
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
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        mobile: owner.mobile,
        photo: owner.photo,
      },
      gym,
      currentSubscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

    const result = await uploadFromBuffer();

    gym.gymLogo = result.secure_url;

    await gym.save();

    return res.status(200).json({
      success: true,
      message: "Gym logo uploaded successfully.",
      gymLogo: gym.gymLogo,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};