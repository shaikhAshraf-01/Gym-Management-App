import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      default:null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },

    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
        index: true,   // 👈 add karo

    },

    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      default: null,
    },

    // ---- Soft delete ----
    // Instead of removing a member outright, "Delete" now just flags
    // them here so the owner can review/restore from Profile ->
    // Deleted Members before anything is permanently removed.
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;