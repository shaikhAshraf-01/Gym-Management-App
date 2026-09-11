import mongoose from "mongoose";

const gymOfferSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },
    // A Meta-approved template name — same idea as the other
    // automations (expiryReminder.templateName etc.)
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    audience: {
      type: String,
      enum: ["all_members", "active_members", "inactive_members", "all_members_and_enquiries"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "sent", "failed", "cancelled"],
      default: "scheduled",
    },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const GymOffer = mongoose.model("GymOffer", gymOfferSchema);
export default GymOffer;