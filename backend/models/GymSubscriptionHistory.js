import mongoose from "mongoose";

const gymSubscriptionHistorySchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gym",
    required: true,
  },
  subscriptionPlan: {
    type: String,
    enum:["basic","pro"],
    required: true,
  },
  duration:{
    type: String,
    enum:["1 month","3 months","6 months","12 months"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    },
    paymentMode:{
        type:String,
        enum:["cash","card","upi"],
        required:true,
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