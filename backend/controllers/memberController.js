import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import MemberPaymentHistory from "../models/MemberPaymentHistory.js";

const PLAN_MONTHS = {
  "1_month": 1,
  "3_month": 3,
  "6_month": 6,
  "1_year": 12,
};

const toDateStr = (d) => new Date(d).toISOString().split("T")[0];

// ---------------------------------------------------------------------
// formatMember
//
// Returns the CURRENT/LATEST membership in the main Members table.
// Older memberships remain available inside membershipHistory.
//
// Main table:
//   planAmount       = latest membership fee
//   amountPayingToday = latest membership's total payments
//   joiningDate      = latest membership start
//   expiryDate       = latest membership expiry
//
// History:
//   Every subscription remains separately visible.
// ---------------------------------------------------------------------
const formatMember = async (memberDoc) => {
  const subscriptions = await MemberSubscriptionHistory.find({
    member: memberDoc._id,
  })
    .populate("createdBy", "name")
    .sort({ joiningDate: 1 });

  if (subscriptions.length === 0) {
    return {
      id: memberDoc._id.toString(),
      name: memberDoc.name,
      mobile: memberDoc.mobile,
      age: memberDoc.age,

      plan: null,

      planAmount: "0",
      amountPayingToday: "0",

      latestPlanAmount: "0",
      latestAmountPaid: "0",

      balanceAmount: "0",
      paymentMode: "upi",

      joiningDate: "",
      expiryDate: "",

      addedBy: "Unknown",

      membershipHistory: [],
    };
  }

  const subscriptionIds = subscriptions.map((s) => s._id);

  const payments = await MemberPaymentHistory.find({
    memberSubscription: { $in: subscriptionIds },
  }).sort({ paymentDate: 1 });

  // ---------------------------------------------------------------
  // Group payments subscription-wise
  // ---------------------------------------------------------------
  const paymentsBySubscription = {};

  payments.forEach((payment) => {
    const key = payment.memberSubscription.toString();

    if (!paymentsBySubscription[key]) {
      paymentsBySubscription[key] = [];
    }

    paymentsBySubscription[key].push(payment);
  });

  // ---------------------------------------------------------------
  // First = original membership
  // Latest = current membership
  // ---------------------------------------------------------------
  const first = subscriptions[0];
  const latest = subscriptions[subscriptions.length - 1];

  // ---------------------------------------------------------------
  // Lifetime totals
  //
  // These are still calculated internally. They can be useful later
  // for reports/revenue pages.
  // ---------------------------------------------------------------
  const totalPlanAmount = subscriptions.reduce(
    (sum, subscription) => sum + Number(subscription.planAmount || 0),
    0
  );

  const totalAmountPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  // ---------------------------------------------------------------
  // Latest subscription payments only
  // ---------------------------------------------------------------
  const latestPayments =
    paymentsBySubscription[latest._id.toString()] || [];

  const latestPaymentMode = latestPayments.length
    ? latestPayments[latestPayments.length - 1].paymentMode
    : "upi";

  const latestAmountPaid = latestPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  // ---------------------------------------------------------------
  // Membership History
  // ---------------------------------------------------------------
  const membershipHistory = subscriptions.map((sub, idx) => {
    const subPayments =
      paymentsBySubscription[sub._id.toString()] || [];

    const amount =
      subPayments.reduce(
        (sum, payment) => sum + Number(payment.amountPaid || 0),
        0
      ) || Number(sub.planAmount || 0);

    const mode = subPayments.length
      ? subPayments[subPayments.length - 1].paymentMode
      : "upi";

    const eventDate = subPayments.length
      ? subPayments[subPayments.length - 1].paymentDate
      : sub.joiningDate;

    return {
      id: sub._id.toString(),

      // First subscription = joined
      // All following subscriptions = extended/renewed
      type: idx === 0 ? "joined" : "extended",

      plan: sub.plan,

      startDate: toDateStr(sub.joiningDate),
      endDate: toDateStr(sub.expiryDate),

      amount: String(amount),

      paymentMode: mode,

      by: sub.createdBy?.name || "Unknown",

      date: toDateStr(eventDate),
    };
  });

  // ---------------------------------------------------------------
  // IMPORTANT:
  //
  // The main Members table now shows ONLY the latest membership.
  //
  // Before:
  //   ₹999 + ₹900 = ₹1899
  //
  // Now:
  //   ₹900
  //
  // Old ₹999 remains safely inside membershipHistory.
  // ---------------------------------------------------------------
  return {
    id: memberDoc._id.toString(),

    name: memberDoc.name,
    mobile: memberDoc.mobile,
    age: memberDoc.age,

    // Current plan
    plan: latest.plan,

    // CURRENT membership values
    planAmount: String(latest.planAmount || 0),
    amountPayingToday: String(latestAmountPaid || 0),

    // Explicit latest values for EditMemberModal
    latestPlanAmount: String(latest.planAmount || 0),
    latestAmountPaid: String(latestAmountPaid || 0),

    // Current membership balance
    balanceAmount: String(latest.balance || 0),

    paymentMode: latestPaymentMode,

    // IMPORTANT:
    // Main table should show current membership dates,
    // not the original joining date.
    joiningDate: toDateStr(latest.joiningDate),
    expiryDate: toDateStr(latest.expiryDate),

    addedBy: first.createdBy?.name || "Unknown",

    membershipHistory,
  };
};

// =====================================================================
// GET MEMBERS
// =====================================================================

export const getMembers = async (req, res) => {
  try {
    const members = await Member.find({
      gym: req.user.gymId,
    }).sort({
      createdAt: -1,
    });

    const formatted = await Promise.all(
      members.map(formatMember)
    );

    res.status(200).json({
      success: true,
      members: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch members.",    });
  }
};

// =====================================================================
// ADD MEMBER
// =====================================================================

export const addMember = async (req, res) => {
  try {
    const {
      name,
      mobile,
      age,
      plan,
      planAmount,
      amountPayingToday,
      balanceAmount,
      paymentMode,
      joiningDate,
      expiryDate,
      trainer,
    } = req.body;

    if (
      !name ||
      !mobile ||
      !plan ||
      !planAmount ||
      !joiningDate ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // ---------------------------------------------------------------
    // Create main member
    // ---------------------------------------------------------------
    const member = await Member.create({
      name,
      mobile,
      age: age || null,
      gym: req.user.gymId,
      trainer: trainer || null,
    });

    // ---------------------------------------------------------------
    // Create first subscription
    // ---------------------------------------------------------------
    const subscription =
      await MemberSubscriptionHistory.create({
        member: member._id,

        plan,

        joiningDate,
        expiryDate,

        planAmount: Number(planAmount),

        balance: Number(balanceAmount || 0),

        createdBy: req.user._id,
      });

    // ---------------------------------------------------------------
    // Initial payment
    // ---------------------------------------------------------------
    if (Number(amountPayingToday) > 0) {
      await MemberPaymentHistory.create({
        memberSubscription: subscription._id,

        amountPaid: Number(amountPayingToday),

        paymentMode: paymentMode || "upi",

        paymentDate: joiningDate,

        remarks: "Initial joining payment",
      });
    }

    const formatted = await formatMember(member);

    res.status(201).json({
      success: true,

      message: "Member added successfully.",

      member: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,

      message: "Failed to add member.",
    });
  }
};

// =====================================================================
// UPDATE MEMBER
// =====================================================================

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      mobile,
      age,
      plan,
      planAmount,
      amountPayingToday,
      balanceAmount,
      paymentMode,
      joiningDate,
      expiryDate,
    } = req.body;

    // ---------------------------------------------------------------
    // Find member belonging to this gym
    // ---------------------------------------------------------------
    const member = await Member.findOne({
      _id: id,
      gym: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    // ---------------------------------------------------------------
    // Update basic member information
    // ---------------------------------------------------------------
    if (name !== undefined) {
      member.name = name;
    }

    if (mobile !== undefined) {
      member.mobile = mobile;
    }

    if (age !== undefined) {
      member.age = age;
    }

    await member.save();

    // ---------------------------------------------------------------
    // Find latest subscription
    // ---------------------------------------------------------------
    const latestSub =
      await MemberSubscriptionHistory.findOne({
        member: member._id,
      }).sort({
        joiningDate: -1,
      });

    if (latestSub) {
      if (plan !== undefined) {
        latestSub.plan = plan;
      }

      if (planAmount !== undefined) {
        latestSub.planAmount = Number(planAmount);
      }

      if (balanceAmount !== undefined) {
        latestSub.balance = Number(balanceAmount);
      }

      if (joiningDate !== undefined) {
        latestSub.joiningDate = joiningDate;
      }

      if (expiryDate !== undefined) {
        latestSub.expiryDate = expiryDate;
      }

      await latestSub.save();

      // -------------------------------------------------------------
      // Update latest payment
      // -------------------------------------------------------------
      if (amountPayingToday !== undefined) {
        const latestPayment =
          await MemberPaymentHistory.findOne({
            memberSubscription: latestSub._id,
          }).sort({
            paymentDate: -1,
          });

        if (latestPayment) {
          latestPayment.amountPaid =
            Number(amountPayingToday);

          if (paymentMode !== undefined) {
            latestPayment.paymentMode = paymentMode;
          }

          await latestPayment.save();
        } else if (Number(amountPayingToday) > 0) {
          await MemberPaymentHistory.create({
            memberSubscription: latestSub._id,

            amountPaid: Number(amountPayingToday),

            paymentMode: paymentMode || "upi",

            paymentDate: joiningDate || new Date(),

            remarks: "Membership payment",
          });
        }
      }
    }

    const formatted = await formatMember(member);

    res.status(200).json({
      success: true,

      message: "Member updated successfully.",

      member: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,

      message: "Failed to update member.",
    });
  }
};

// =====================================================================
// DELETE MEMBER
// =====================================================================

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findOne({
      _id: id,
      gym: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    const subscriptions =
      await MemberSubscriptionHistory.find({
        member: member._id,
      });

    const subscriptionIds =
      subscriptions.map((s) => s._id);

    // Delete payments
    await MemberPaymentHistory.deleteMany({
      memberSubscription: {
        $in: subscriptionIds,
      },
    });

    // Delete subscription history
    await MemberSubscriptionHistory.deleteMany({
      member: member._id,
    });

    // Delete member
    await Member.findByIdAndDelete(id);

    res.status(200).json({
      success: true,

      message: "Member deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,

      message: "Failed to delete member.",
    });
  }
};

// =====================================================================
// EXTEND / RENEW MEMBERSHIP
// =====================================================================
//
// IMPORTANT RULE:
//
// If current membership is ACTIVE:
//
//   Current expiry = 10 Aug
//   Renewal on = 08 Aug
//
//   New start = 11 Aug
//
// If membership is EXPIRED:
//
//   Current expiry = 04 Aug
//   Renewal on = 10 Aug
//
//   New start = 10 Aug
//
// So we NEVER lose remaining active membership time,
// and we NEVER start an expired membership in the past.
// =====================================================================

export const extendMembership = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      plan,
      extensionAmount,
      amountPayingToday,
      balanceAmount,
      paymentMode,
      newStartDate,
    } = req.body;

    // ---------------------------------------------------------------
    // Find member belonging to current gym
    // ---------------------------------------------------------------
    const member = await Member.findOne({
      _id: id,
      gym: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    // ---------------------------------------------------------------
    // Find latest/current subscription
    // ---------------------------------------------------------------
    const latestSub =
      await MemberSubscriptionHistory.findOne({
        member: member._id,
      }).sort({
        joiningDate: -1,
      });

    // ---------------------------------------------------------------
    // Validate plan
    // ---------------------------------------------------------------
    const monthsToAdd = PLAN_MONTHS[plan];

    if (!monthsToAdd) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan.",
      });
    }

    // ---------------------------------------------------------------
    // Today
    // ---------------------------------------------------------------
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // ---------------------------------------------------------------
    // Calculate the default start date.
    //
    // If old membership is expired:
    //
    //     old expiry = 04 Aug
    //     today      = 14 Aug
    //
    //     default start = 14 Aug
    //
    // If old membership is active:
    //
    //     old expiry = 20 Aug
    //     today      = 14 Aug
    //
    //     default start = 21 Aug
    // ---------------------------------------------------------------
    let defaultStartDate = new Date(today);

    if (latestSub?.expiryDate) {
      const currentExpiry =
        new Date(latestSub.expiryDate);

      currentExpiry.setHours(0, 0, 0, 0);

      if (currentExpiry >= today) {
        defaultStartDate =
          new Date(currentExpiry);

        defaultStartDate.setDate(
          defaultStartDate.getDate() + 1
        );
      }
    }

    // ---------------------------------------------------------------
    // If frontend sends a start date, use it.
    //
    // This allows the gym owner to manually choose the date.
    //
    // Otherwise use calculated default.
    // ---------------------------------------------------------------
    let startFrom = defaultStartDate;

    if (newStartDate) {
      const selectedStartDate =
        new Date(`${newStartDate}T12:00:00`);

      if (Number.isNaN(selectedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid renewal start date.",
        });
      }

      selectedStartDate.setHours(0, 0, 0, 0);

      startFrom = selectedStartDate;
    }

    // ---------------------------------------------------------------
    // Calculate new expiry
    // ---------------------------------------------------------------
    const newExpiry =
      new Date(startFrom);

    newExpiry.setMonth(
      newExpiry.getMonth() + monthsToAdd
    );

    // ---------------------------------------------------------------
    // Create NEW subscription
    //
    // IMPORTANT:
    // Old membership remains untouched.
    // It stays in MemberSubscriptionHistory.
    // ---------------------------------------------------------------
    const newSubscription =
      await MemberSubscriptionHistory.create({
        member: member._id,

        plan,

        joiningDate: startFrom,

        expiryDate: newExpiry,

        planAmount: Number(
          extensionAmount || 0
        ),

        balance: Number(
          balanceAmount || 0
        ),

        createdBy: req.user._id,
      });

    // ---------------------------------------------------------------
    // Create payment for NEW membership
    // ---------------------------------------------------------------
    if (Number(amountPayingToday) > 0) {
      await MemberPaymentHistory.create({
        memberSubscription:
          newSubscription._id,

        amountPaid:
          Number(amountPayingToday),

        paymentMode:
          paymentMode || "upi",

        paymentDate: today,

        remarks:
          "Membership renewal payment",
      });
    }

    // ---------------------------------------------------------------
    // Return current member
    // ---------------------------------------------------------------
    const formatted =
      await formatMember(member);

    return res.status(200).json({
      success: true,

      message:
        "Membership renewed successfully.",

      member: formatted,
    });
  } catch (error) {
    console.error(
      "extendMembership error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to renew membership.",
    });
  }
};