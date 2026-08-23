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

    // NOTE: changed from ["Cash","UPI","Card"] -> ["upi","cash","both"].
    // Frontend forms (MembershipForm, EditMemberModal, ExtendMembershipModal)
    // send lowercase "upi" | "cash" | "both" — the old enum didn't even
    // have a "both" option and would have rejected every save.
    paymentMode: {
      type: String,
      enum: ["upi", "cash", "both"],
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