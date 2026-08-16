import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import User, { Owner, Trainer } from "../models/User.js";
import GymSubscriptionHistory from "../models/GymSubscriptionHistory.js";
import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import MemberPaymentHistory from "../models/MemberPaymentHistory.js";
import Inquiry from "../models/Inquiry.js";

// Gym model has no totalMembers field — count comes live from the
// Member collection instead of relying on a stale/undefined property.
const getMembersCount = async (gymId) => {
  return await Member.countDocuments({ gym: gymId });
};

// "Active" = member's latest MemberSubscriptionHistory.expiryDate
// hasn't passed yet. A member can have several subscription rows
// (renewals), so we take each member's most recent one (by
// joiningDate) and check only that.
const getActiveMembersCount = async (gymId) => {
  const memberIds = await Member.find({ gym: gymId }).distinct("_id");

  if (memberIds.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await MemberSubscriptionHistory.aggregate([
    { $match: { member: { $in: memberIds } } },
    { $sort: { joiningDate: -1 } },
    {
      $group: {
        _id: "$member",
        latestExpiryDate: { $first: "$expiryDate" },
      },
    },
    { $match: { latestExpiryDate: { $gte: today } } },
    { $count: "activeCount" },
  ]);

  return result[0]?.activeCount || 0;
};

// Trainers are separate User documents (role: "trainer"), not an
// embedded array on Gym. Frontend code keys off `trainer.id`, so we
// map Mongo's `_id` -> `id` here once and reuse everywhere, instead
// of changing every trainer.id reference across the frontend.
const getFormattedTrainers = async (gymId) => {
  const trainers = await Trainer.find({ gymId }).select(
    "-password -otp -otpExpires"
  );
  return trainers.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    mobile: t.mobile,
    email: t.email,
  }));
};

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

  if ( !gymName || !location || !ownerName || !ownerMobile || !ownerEmail ||
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

  const populatedGym = await Gym.findById(gym._id).populate("owner");
  const subscriptionHistory = await GymSubscriptionHistory.find({
    gymId: gym._id,
  }).sort({ startDate: 1 });
  const currentSubscription =
    subscriptionHistory[subscriptionHistory.length - 1] || null;
  const trainers = await getFormattedTrainers(gym._id);
  const totalMembers = await getMembersCount(gym._id);
  const activeMembers = await getActiveMembersCount(gym._id);

  res.status(201).json({
    success: true,
    message: "Gym created successfully.",
    gym: {
      _id: populatedGym._id,
      gymCode: populatedGym.gymCode,
      gymName: populatedGym.gymName,
      location: populatedGym.location,
      gymLogo: populatedGym.gymLogo,
      status: populatedGym.status,
      owner: populatedGym.owner,
      trainers,
      totalMembers,
      activeMembers,
      address: populatedGym.address || "",
      subscriptionHistory,
      currentSubscription,
    },
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

// -------------------------------------------------------------------
// getAllGyms — same as before, just "seccess" -> "success"
// -------------------------------------------------------------------
export const getAllGyms = async (req, res) => {
  try {
    const gyms = await Gym.find().populate("owner").sort({ createdAt: -1 });

    const data = await Promise.all(
      gyms.map(async (gym) => {
        const subscription = await GymSubscriptionHistory.find({
          gymId: gym._id,
        }).sort({ startDate: 1 });
        const currentSubscription =
          subscription.length > 0
            ? subscription[subscription.length - 1]
            : null;
        const trainers = await getFormattedTrainers(gym._id);
        const totalMembers = await getMembersCount(gym._id);
        const activeMembers = await getActiveMembersCount(gym._id);
        return {
          _id: gym._id,
          gymCode: gym.gymCode,
          gymName: gym.gymName,
          location: gym.location,
          gymLogo: gym.gymLogo,
          status: gym.status,
          owner: gym.owner,
          trainers,
          totalMembers,
          activeMembers,
          address: gym.address || "",
          subscriptionHistory: subscription,
          currentSubscription,
        };
      })
    );

    res.status(200).json({
      success: true,
      gyms: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gyms",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// updateGym — PUT /api/gyms/:id
// Accepts the full edited gym object from the drawer (status, address,
// owner {name, mobile, email}, trainers[], currentSubscription).
// Returns the freshly saved gym in the SAME shape getAllGyms uses, so
// the frontend can drop it straight into state.
// -------------------------------------------------------------------
export const updateGym = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      address,
      owner,
      trainers,
      currentSubscription,
    } = req.body;

    // ============================================================
    // 1. FIND GYM
    // ============================================================

    const gym = await Gym.findById(id);

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    // ============================================================
    // 2. UPDATE GYM BASIC DETAILS
    // ============================================================

    if (status !== undefined) {
      gym.status = status;
    }

    if (address !== undefined) {
      gym.address = address;
    }

    await gym.save();

    // ============================================================
    // 3. UPDATE OWNER
    // ============================================================

    if (owner) {
      await Owner.findByIdAndUpdate(
        gym.owner,
        {
          ...(owner.name !== undefined && {
            name: owner.name,
          }),

          ...(owner.mobile !== undefined && {
            mobile: owner.mobile,
          }),

          ...(owner.email !== undefined && {
            email: owner.email.toLowerCase(),
          }),
        },
        {
          runValidators: true,
        }
      );
    }

    // ============================================================
    // 4. UPDATE TRAINERS
    // ============================================================

    if (trainers !== undefined && Array.isArray(trainers)) {
      const existingTrainers = await Trainer.find({
        gymId: gym._id,
      });

      const incomingIds = trainers
        .map((trainer) => trainer.id)
        .filter((trainerId) =>
          mongoose.Types.ObjectId.isValid(trainerId)
        );

      // Delete trainers removed from frontend
      const trainersToDelete = existingTrainers.filter(
        (existingTrainer) =>
          !incomingIds.includes(
            existingTrainer._id.toString()
          )
      );

      await Promise.all(
        trainersToDelete.map((trainer) =>
          Trainer.findByIdAndDelete(trainer._id)
        )
      );

      // Update existing trainers / create new trainers
      await Promise.all(
        trainers.map(async (trainer) => {
          // Existing trainer
          if (
            trainer.id &&
            mongoose.Types.ObjectId.isValid(trainer.id)
          ) {
            await Trainer.findByIdAndUpdate(
              trainer.id,
              {
                name: trainer.name,
                mobile: trainer.mobile,
                email: trainer.email?.toLowerCase(),
              },
              {
                runValidators: true,
              }
            );
          }

          // New trainer
          else {
            await Trainer.create({
              name: trainer.name,
              mobile: trainer.mobile,
              email: trainer.email?.toLowerCase(),
              gymId: gym._id,
            });
          }
        })
      );
    }

    // ============================================================
    // 5. IMPORTANT:
    // UPDATE CURRENT SUBSCRIPTION ONLY
    // ============================================================
    //
    // This does NOT create a new history entry.
    //
    // Frontend currentSubscription contains the existing
    // subscription _id.
    //
    // We update that exact document.
    //
    // ============================================================

    if (currentSubscription) {
      const subscriptionId = currentSubscription._id;

      // ----------------------------------------------------------
      // EXISTING CURRENT SUBSCRIPTION
      // ----------------------------------------------------------

      if (
        subscriptionId &&
        mongoose.Types.ObjectId.isValid(subscriptionId)
      ) {
        const existingSubscription =
          await GymSubscriptionHistory.findOne({
            _id: subscriptionId,
            gymId: gym._id,
          });

        if (!existingSubscription) {
          return res.status(404).json({
            success: false,
            message: "Current subscription not found.",
          });
        }

        // Update ONLY the current subscription
        existingSubscription.subscriptionPlan =
          currentSubscription.subscriptionPlan;

        existingSubscription.durationMonths =
          currentSubscription.durationMonths;

        existingSubscription.amount =
          currentSubscription.amount;

        existingSubscription.paymentMode =
          currentSubscription.paymentMode;

        existingSubscription.startDate =
          currentSubscription.startDate;

        existingSubscription.endDate =
          currentSubscription.endDate;

        await existingSubscription.save();
      }

      // ----------------------------------------------------------
      // NO ID
      // ----------------------------------------------------------
      //
      // This case is only for an actual NEW renewal.
      //
      // Your "Renew / Change Subscription" button creates a new
      // subscription without _id, so that one WILL be added to
      // history.
      //
      // ----------------------------------------------------------

      else {
        await GymSubscriptionHistory.create({
          gymId: gym._id,
          subscriptionPlan:
            currentSubscription.subscriptionPlan,

          durationMonths:
            currentSubscription.durationMonths,

          amount:
            currentSubscription.amount,

          paymentMode:
            currentSubscription.paymentMode,

          startDate:
            currentSubscription.startDate,

          endDate:
            currentSubscription.endDate,
        });
      }
    }

    // ============================================================
    // 6. FETCH FRESH DATA
    // ============================================================

    const populatedGym =
      await Gym.findById(id).populate("owner");

    const subscriptionHistory =
      await GymSubscriptionHistory.find({
        gymId: gym._id,
      }).sort({
        startDate: 1,
      });

    const updatedCurrentSubscription =
      subscriptionHistory.length > 0
        ? subscriptionHistory[subscriptionHistory.length - 1]
        : null;

    const updatedTrainers =
      await getFormattedTrainers(gym._id);

    const totalMembers =
      await getMembersCount(gym._id);

    const activeMembers =
      await getActiveMembersCount(gym._id);

    // ============================================================
    // 7. RETURN UPDATED GYM
    // ============================================================

    return res.status(200).json({
      success: true,
      message: "Gym updated successfully.",

      gym: {
        _id: populatedGym._id,
        gymCode: populatedGym.gymCode,
        gymName: populatedGym.gymName,
        location: populatedGym.location,
        gymLogo: populatedGym.gymLogo,
        status: populatedGym.status,

        owner: populatedGym.owner,

        trainers: updatedTrainers,

        totalMembers,

        activeMembers,

        address: populatedGym.address || "",

        subscriptionHistory,

        currentSubscription:
          updatedCurrentSubscription,
      },
    });
  } catch (error) {
    console.error("UPDATE GYM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update gym.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// addTrainer — POST /api/gyms/:id/trainers
// Trainers are NOT embedded on the Gym document — they're their own
// User documents (role: "trainer", via the Trainer discriminator),
// linked by gymId, exactly like Owner is created in createGym.
// Returns the full updated gym (with a fresh trainers[] list pulled
// from the Trainer collection) in the same shape getAllGyms uses.
// -------------------------------------------------------------------
export const addTrainer = async (req, res) => {
  try {
    const { id } = req.params; // gym id
    const { name, mobile, email } = req.body;

    if (!name || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required trainer fields.",
      });
    }

    const gym = await Gym.findById(id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    // mobile/email are unique across the whole User collection
    // (admin/owner/trainer all share it), so check before creating —
    // same pattern as the existingOwner check in createGym.
    const existingUser = await User.findOne({
      $or: [{ mobile }, { email: email.toLowerCase() }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this mobile number or email already exists.",
      });
    }

    await Trainer.create({
      name,
      mobile,
      email: email.toLowerCase(),
      gymId: gym._id,
    });

    const populatedGym = await Gym.findById(id).populate("owner");
    const trainers = await getFormattedTrainers(gym._id);
    const totalMembers = await getMembersCount(gym._id);
    const activeMembers = await getActiveMembersCount(gym._id);
    const subscriptionHistory = await GymSubscriptionHistory.find({
      gymId: gym._id,
    }).sort({ startDate: 1 });
    const currentSubscription =
      subscriptionHistory[subscriptionHistory.length - 1] || null;

    res.status(201).json({
      success: true,
      message: "Trainer added successfully.",
      gym: {
        _id: populatedGym._id,
        gymCode: populatedGym.gymCode,
        gymName: populatedGym.gymName,
        location: populatedGym.location,
        gymLogo: populatedGym.gymLogo,
        status: populatedGym.status,
        owner: populatedGym.owner,
        trainers,
        totalMembers,
        activeMembers,
        address: populatedGym.address || "",
        subscriptionHistory,
        currentSubscription,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to add trainer.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// deleteTrainer — DELETE /api/gyms/:id/trainers/:trainerId
// Removes one trainer (a User doc, role: "trainer") from a gym.
// Returns the full updated gym in the same shape as everywhere else.
// -------------------------------------------------------------------
export const deleteTrainer = async (req, res) => {
  try {
    const { id, trainerId } = req.params; // id = gym id

    const gym = await Gym.findById(id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    const trainer = await Trainer.findOne({ _id: trainerId, gymId: gym._id });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found for this gym.",
      });
    }

    await Trainer.findByIdAndDelete(trainerId);

    const populatedGym = await Gym.findById(id).populate("owner");
    const trainers = await getFormattedTrainers(gym._id);
    const totalMembers = await getMembersCount(gym._id);
    const activeMembers = await getActiveMembersCount(gym._id);
    const subscriptionHistory = await GymSubscriptionHistory.find({
      gymId: gym._id,
    }).sort({ startDate: 1 });
    const currentSubscription =
      subscriptionHistory[subscriptionHistory.length - 1] || null;

    res.status(200).json({
      success: true,
      message: "Trainer removed successfully.",
      gym: {
        _id: populatedGym._id,
        gymCode: populatedGym.gymCode,
        gymName: populatedGym.gymName,
        location: populatedGym.location,
        gymLogo: populatedGym.gymLogo,
        status: populatedGym.status,
        owner: populatedGym.owner,
        trainers,
        totalMembers,
        activeMembers,
        address: populatedGym.address || "",
        subscriptionHistory,
        currentSubscription,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to remove trainer.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// deleteGym — DELETE /api/gyms/:id
// Removes the gym and cascades the delete across every piece of data
// tied to it (members, their subscription/payment history, inquiries,
// WhatsApp logs, trainers, owner, and gym subscription history).
// -------------------------------------------------------------------
export const deleteGym = async (req, res) => {
  try {
    const { id } = req.params;

    const gym = await Gym.findById(id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    // Members go first — MemberSubscriptionHistory and
    // MemberPaymentHistory are keyed off individual member IDs, not
    // the gym directly.
    const members = await Member.find({ gym: gym._id }, "_id");
    const memberIds = members.map((m) => m._id);

    if (memberIds.length > 0) {
      const subscriptions = await MemberSubscriptionHistory.find(
        { member: { $in: memberIds } },
        "_id"
      );
      const subscriptionIds = subscriptions.map((s) => s._id);

      await MemberPaymentHistory.deleteMany({
        memberSubscription: { $in: subscriptionIds },
      });
      await MemberSubscriptionHistory.deleteMany({
        member: { $in: memberIds },
      });
      await Member.deleteMany({ gym: gym._id });
    }

    await Inquiry.deleteMany({ gym: gym._id });

    await Owner.findByIdAndDelete(gym.owner);
    await Trainer.deleteMany({ gymId: gym._id });
    await GymSubscriptionHistory.deleteMany({ gymId: gym._id });
    await Gym.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gym deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gym.",
      error: error.message,
    });
  }
};