import mongoose from "mongoose";

const gymSubscriptionHistorySchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gym",
    required: true,
  },
  subscriptionPlan: {
    type: String,
    enum: ["Basic", "Plus", "Pro"],
    required: true,
  },
  durationMonths: {
    type: Number,
    enum: [1, 3, 6, 12],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Card"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

const GymSubscriptionHistory = mongoose.model("GymSubscriptionHistory", gymSubscriptionHistorySchema);
export default GymSubscriptionHistory;