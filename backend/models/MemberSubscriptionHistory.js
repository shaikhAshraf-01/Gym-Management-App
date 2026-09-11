import mongoose from "mongoose";

const memberSubscriptionHistorySchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
        index: true,   // 👈 add karo

    },

    plan: {
      type: String,
      required: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    planAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Was this admission taken under a special offer, or normal
    // pricing? Drives the blue "Offer" badge in Members/Profile and
    // the offer-admissions tile in Sales.
    admissionType: {
      type: String,
      enum: ["normal", "offer"],
      default: "normal",
    },

    // Selected activities for this subscription (workout, cardio, etc.)
    // Must be declared here or Mongoose silently strips it on save.
    activities: {
      type: [String],
      default: [],
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Was the PREVIOUS membership still active (not expired) at the
    // moment this subscription was created? true = "Extended",
    // false = "Renewed" (member had already expired). null/undefined
    // for the very first subscription (= "Joined") or legacy records
    // created before this field existed.
    wasActive: {
      type: Boolean,
      default: null,
    },
 
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },
},
  {
    timestamps: true,
  }
);

const MemberSubscriptionHistory = mongoose.model(
  "MemberSubscriptionHistory",
  memberSubscriptionHistorySchema
);

export default MemberSubscriptionHistory;