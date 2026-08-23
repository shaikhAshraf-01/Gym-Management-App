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
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;