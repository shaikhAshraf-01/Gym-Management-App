import mongoose from "mongoose";

const memberPaymentHistorySchema = new mongoose.Schema(
  {
    memberSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MemberSubscriptionHistory",
      required: true,
        index: true,   // 👈 add karo

    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    // NOTE: "both" used to be a selectable option; it's removed now
    // (owners couldn't tell how much was cash vs UPI). Kept out of the
    // enum entirely — any legacy "both" record gets normalized to
    // "cash" in memberController before it's ever re-saved, so it
    // never hits this validation.
    paymentMode: {
      type: String,
      enum: ["upi", "cash"],
      required: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const MemberPaymentHistory = mongoose.model(
  "MemberPaymentHistory",
  memberPaymentHistorySchema
);

export default MemberPaymentHistory;