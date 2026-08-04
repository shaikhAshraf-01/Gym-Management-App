import Gym from "../models/Gym.js";
import { Owner } from "../models/User.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";

// @route   POST /api/gyms
// @access  Private (admin only)
export const createGym = async (req, res) => {
  try{
  const {
    gymName,
    location,
    gymLogo,

    ownerName,
    ownerMobile,
    ownerEmail,

    subscriptionPlan,
    amount,
    paymentMode,
    durationMonths,
  } = req.body;

  if ( !gymName || !ownerName || !ownerMobile || !ownerEmail ||
     !subscriptionPlan || !amount || !paymentMode || !durationMonths) {
    return res.status(400).json({
      success: false,
      message: "Please filled all required fields.",
    });
  }

  const existingOwner = await Owner.findOne({ $or: [{ mobile: ownerMobile }, { email: ownerEmail.toLowerCase() }] });
  if (existingOwner) {
    return res.status(409).json({
      success: false,
      message: "An owner with this mobile number or email already exists.",
    });
  }

  const lastGym=await Gym.findOne().sort({ createdAt: -1 });
  let nextNumber=101;
  if(lastGym && lastGym.gymCode){
    nextNumber=Number(lastGym.gymCode.split("-")[1])+1;
  }
  const gymCode=`GYM-${nextNumber}`;
  //create gym
  const gym=await Gym.create({
    gymCode,
    gymName,
    location,
    gymLogo,
    status:"active",
  });
  // create owner
  const owner=await Owner.create({
    name: ownerName,
    mobile: ownerMobile,
    email: ownerEmail.toLowerCase(),
    role: "owner",
    gymId: gym._id,
  });
  //link owner
  gym.owner=owner._id;
  await gym.save();
  //create subscription history 
  const startDate=new Date();
  const endDate=new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(durationMonths));
  await GymSubscriptionHistory.create({
    gymId: gym._id,
    subscriptionPlan,
    durationMonths,
    amount,
    paymentMode,
    startDate,
    endDate,
  });

  res.status(201).json({
    success: true,
    message: "Gym created successfully.",
    gym,
  });
}
catch(error){
  console.log(error);
  res.status(500).json({
    success:false,
    message:"Internal server error",
    error: error.message,
    stack:error.stack,
  })
}
}