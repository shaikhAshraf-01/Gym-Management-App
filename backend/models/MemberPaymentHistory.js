import mongoose from "mongoose";

const memberPaymentHistorySchema = new mongoose.Schema(
  {
    memberSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MemberSubscriptionHistory",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
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