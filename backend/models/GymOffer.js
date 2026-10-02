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
    // Human-readable campaign name (e.g. "Diwali Offer") — sent as the
    // template's {{2}} and shown in the offers list. Not `required` at
    // schema level on purpose: offers created before this field existed
    // would otherwise fail validation every time the cron job re-saves
    // them. The controller enforces it for new offers.
    offerName: {
      type: String,
      default: "",
      trim: true,
    },
    // The rate-card image shown in the template's header. Hosted on
    // ImageKit; Meta fetches it by URL at send time. The fileId is kept
    // so the file can be deleted when the offer is cancelled.
    imageUrl: {
      type: String,
      default: "",
    },
    imageFileId: {
      type: String,
      default: "",
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