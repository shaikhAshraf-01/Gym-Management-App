import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import MemberPaymentHistory from "../models/MemberPaymentHistory.js";
import Gym from "../models/Gym.js";
import { emitToGym } from "../socket/index.js";
import { triggerMemberAutomation, uploadWhatsappMedia } from "../utils/sendWhatsappMessage.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";

const PLAN_MONTHS = {
  "1_month": 1,
  "3_month": 3,
  "6_month": 6,
  "1_year": 12,
};

const toDateStr = (d) => new Date(d).toISOString().split("T")[0];

// ---------------------------------------------------------------------
// pruneOldSubscriptionHistory
// ---------------------------------------------------------------------
const pruneOldSubscriptionHistory = async (memberId, keep = 6) => {
  const oldSubscriptions = await MemberSubscriptionHistory.find({
    member: memberId,
  })
    .sort({ joiningDate: -1 })
    .skip(keep)
    .select("_id");

  const oldSubscriptionIds = oldSubscriptions.map((s) => s._id);

  if (oldSubscriptionIds.length === 0) return;

  await MemberPaymentHistory.deleteMany({
    memberSubscription: { $in: oldSubscriptionIds },
  });

  await MemberSubscriptionHistory.deleteMany({
    _id: { $in: oldSubscriptionIds },
  });
};

// ---------------------------------------------------------------------
// formatMember
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
      gender: memberDoc.gender,

      plan: null,
      admissionType: "normal",

      activities: [],

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

  const paymentsBySubscription = {};

  payments.forEach((payment) => {
    const key = payment.memberSubscription.toString();

    if (!paymentsBySubscription[key]) {
      paymentsBySubscription[key] = [];
    }

    paymentsBySubscription[key].push(payment);
  });

  const first = subscriptions[0];
  const latest = subscriptions[subscriptions.length - 1];

  const latestPayments = paymentsBySubscription[latest._id.toString()] || [];

  const latestPaymentMode = latestPayments.length
    ? latestPayments[latestPayments.length - 1].paymentMode
    : "upi";

  const latestAmountPaid = latestPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const membershipHistory = subscriptions.map((sub, idx) => {
    const subPayments = paymentsBySubscription[sub._id.toString()] || [];

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

    let type = "joined";

    if (idx > 0) {
      if (sub.wasActive === true) {
        type = "extended";
      } else if (sub.wasActive === false) {
        type = "renewed";
      } else {
        const prevExpiry = new Date(subscriptions[idx - 1].expiryDate);
        const thisStart = new Date(sub.joiningDate);

        prevExpiry.setHours(0, 0, 0, 0);
        thisStart.setHours(0, 0, 0, 0);

        const gapDays = Math.round(
          (thisStart - prevExpiry) / (1000 * 60 * 60 * 24)
        );

        type = gapDays > 1 ? "renewed" : "extended";
      }
    }

    return {
      id: sub._id.toString(),
      type,
      plan: sub.plan,
      admissionType: sub.admissionType || "normal",
      offerName: sub.offerName || "",
      discount: sub.discount || 0,
      activities: sub.activities || [],
      startDate: toDateStr(sub.joiningDate),
      endDate: toDateStr(sub.expiryDate),
      amount: String(amount),
      paymentMode: mode,
      by: sub.createdBy?.name || "Unknown",
      date: toDateStr(eventDate),
    };
  });

  return {
    id: memberDoc._id.toString(),
    name: memberDoc.name,
    mobile: memberDoc.mobile,
    age: memberDoc.age,
    gender: memberDoc.gender,
    plan: latest.plan,
    admissionType: latest.admissionType || "normal",
    offerName: latest.offerName || "",
    discount: latest.discount || 0,
    activities: latest.activities || [],
    planAmount: String(latest.planAmount || 0),
    amountPayingToday: String(latestAmountPaid || 0),
    latestPlanAmount: String(latest.planAmount || 0),
    latestAmountPaid: String(latestAmountPaid || 0),
    balanceAmount: String(latest.balance || 0),
    paymentMode: latestPaymentMode,
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
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const formatted = await Promise.all(members.map(formatMember));

    res.status(200).json({
      success: true,
      members: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch members.",
    });
  }
};

// =====================================================================
// GET DELETED MEMBERS
// =====================================================================
export const getDeletedMembers = async (req, res) => {
  try {
    const members = await Member.find({
      gym: req.user.gymId,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    const formatted = await Promise.all(members.map(formatMember));

    res.status(200).json({
      success: true,
      members: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deleted members.",
    });
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
      gender,
      plan,
      planAmount,
      amountPayingToday,
      balanceAmount,
      paymentMode,
      joiningDate,
      expiryDate,
      trainer,
      activities,
      admissionType,
      offerName,
      discount,
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

    const member = await Member.create({
      name,
      mobile,
      age: age || null,
      gender: gender || null,
      gym: req.user.gymId,
      trainer: trainer || null,
    });

    const subscription = await MemberSubscriptionHistory.create({
      member: member._id,
      plan,
      joiningDate,
      expiryDate,
      planAmount: Number(planAmount),
      admissionType: admissionType === "offer" ? "offer" : "normal",
      offerName: admissionType === "offer" ? String(offerName || "").trim() : "",
      discount: admissionType !== "offer" ? Number(discount || 0) : 0,
      balance: Number(balanceAmount || 0),
      activities: Array.isArray(activities) ? activities : [],
      createdBy: req.user._id,
    });

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
    emitToGym(req.user.gymId, "member:created", { member: formatted });

    // WhatsApp Automation Trigger
    (async () => {
      let headerMediaId = null;
      let gymName = "";

      try {
        const gymDoc = await Gym.findById(req.user.gymId).select(
          "gymName gstNumber whatsappIntegration.connected whatsappAutomationSettings.enabled whatsappAutomationSettings.memberWelcome +whatsappIntegration.accessToken"
        );

        if (!gymDoc) return;
        gymName = gymDoc.gymName || "";

        const automationLive =
          gymDoc?.whatsappIntegration?.connected &&
          gymDoc?.whatsappAutomationSettings?.enabled &&
          gymDoc?.whatsappAutomationSettings?.memberWelcome?.enabled;

        if (automationLive) {
          // Generate PDF Invoice
          const pdfBuffer = await generateInvoicePdf({
            gym: gymDoc,
            member: { name, mobile, plan },
            subscription: { planAmount, plan, joiningDate },
          });

          // Upload Media to WhatsApp API
          const uploadResult = await uploadWhatsappMedia({
            gym: gymDoc,
            fileBuffer: pdfBuffer,
            filename: "invoice.pdf",
          });

          if (uploadResult.success) {
            headerMediaId = uploadResult.mediaId;
          } else {
            console.error("❌ Welcome invoice upload failed:", uploadResult.error);
          }
        }

        const automationResult = await triggerMemberAutomation({
          gymId: req.user.gymId,
          automationKey: "memberWelcome",
          toPhone: mobile,
          templateParams: [name, gymName],
          headerMediaId,
        });

        console.log("Welcome automation response:", automationResult);
      } catch (error) {
        console.error("Welcome automation error:", error);
      }
    })();

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
      gender,
      plan,
      planAmount,
      amountPayingToday,
      balanceAmount,
      paymentMode,
      joiningDate,
      expiryDate,
      activities,
    } = req.body;

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

    if (name !== undefined) member.name = name;
    if (mobile !== undefined) member.mobile = mobile;
    if (age !== undefined) member.age = age === "" ? null : age;
    if (gender !== undefined) member.gender = gender === "" ? null : gender;

    await member.save();

    const latestSub = await MemberSubscriptionHistory.findOne({
      member: member._id,
    }).sort({ joiningDate: -1 });

    let balanceJustCleared = false;

    if (latestSub) {
      const oldBalance = Number(latestSub.balance || 0);

      if (plan !== undefined) latestSub.plan = plan;
      if (planAmount !== undefined) latestSub.planAmount = Number(planAmount);

      if (balanceAmount !== undefined) {
        const newBalance = Number(balanceAmount);
        if (oldBalance > 0 && newBalance === 0) {
          balanceJustCleared = true;
        }
        latestSub.balance = newBalance;
      }

      if (activities !== undefined) {
        latestSub.activities = Array.isArray(activities) ? activities : [];
      }

      if (joiningDate !== undefined) latestSub.joiningDate = joiningDate;
      if (expiryDate !== undefined) latestSub.expiryDate = expiryDate;

      await latestSub.save();

      if (amountPayingToday !== undefined) {
        const latestPayment = await MemberPaymentHistory.findOne({
          memberSubscription: latestSub._id,
        }).sort({ paymentDate: -1 });

        if (latestPayment) {
          latestPayment.amountPaid = Number(amountPayingToday);
          if (paymentMode !== undefined) {
            latestPayment.paymentMode = paymentMode;
          } else if (latestPayment.paymentMode === "both") {
            latestPayment.paymentMode = "cash";
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
    emitToGym(req.user.gymId, "member:updated", { member: formatted });

    if (balanceJustCleared) {
      triggerMemberAutomation({
        gymId: req.user.gymId,
        automationKey: "balanceConfirmation",
        toPhone: member.mobile,
        templateParams: [
          String(member.name || "Member"),
          "0",
          String(latestSub?.plan || plan || "N/A"),
        ],
      }).catch((err) => console.error("Balance automation error:", err));
    }

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

    member.isDeleted = true;
    member.deletedAt = new Date();
    await member.save();

    emitToGym(req.user.gymId, "member:deleted", { id });

    res.status(200).json({
      success: true,
      message: "Member moved to deleted members.",
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
// RESTORE MEMBER
// =====================================================================
export const restoreMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findOne({
      _id: id,
      gym: req.user.gymId,
      isDeleted: true,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Deleted member not found.",
      });
    }

    member.isDeleted = false;
    member.deletedAt = null;
    await member.save();

    const formatted = await formatMember(member);
    emitToGym(req.user.gymId, "member:restored", { member: formatted });

    res.status(200).json({
      success: true,
      message: "Member restored successfully.",
      member: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to restore member.",
    });
  }
};

// =====================================================================
// PERMANENT DELETE MEMBER
// =====================================================================
export const permanentDeleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findOne({
      _id: id,
      gym: req.user.gymId,
      isDeleted: true,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Deleted member not found.",
      });
    }

    const subscriptions = await MemberSubscriptionHistory.find({
      member: member._id,
    });

    const subscriptionIds = subscriptions.map((s) => s._id);

    await MemberPaymentHistory.deleteMany({
      memberSubscription: { $in: subscriptionIds },
    });

    await MemberSubscriptionHistory.deleteMany({
      member: member._id,
    });

    await Member.findByIdAndDelete(id);
    emitToGym(req.user.gymId, "member:permanently-deleted", { id });

    res.status(200).json({
      success: true,
      message: "Member permanently deleted.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete member.",
    });
  }
};

// =====================================================================
// DELETE CURRENT MEMBERSHIP
// =====================================================================
export const deleteCurrentMembership = async (req, res) => {
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

    const currentMembership = await MemberSubscriptionHistory.findOne({
      member: member._id,
    }).sort({ joiningDate: -1, createdAt: -1 });

    if (!currentMembership) {
      return res.status(404).json({
        success: false,
        message: "No current membership found.",
      });
    }

    await MemberPaymentHistory.deleteMany({
      memberSubscription: currentMembership._id,
    });
    await MemberSubscriptionHistory.deleteOne({ _id: currentMembership._id });

    const formatted = await formatMember(member);
    emitToGym(req.user.gymId, "member:updated", { member: formatted });

    res.status(200).json({
      success: true,
      message: "Current membership deleted successfully.",
      member: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete current membership.",
    });
  }
};

// =====================================================================
// EXTEND / RENEW MEMBERSHIP
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
      activities,
      admissionType,
      offerName,
      discount,
    } = req.body;

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

    const latestSub = await MemberSubscriptionHistory.findOne({
      member: member._id,
    }).sort({ joiningDate: -1 });

    const monthsToAdd = PLAN_MONTHS[plan];

    if (!monthsToAdd) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let defaultStartDate = new Date(today);
    let wasActive = false;

    if (latestSub?.expiryDate) {
      const currentExpiry = new Date(latestSub.expiryDate);
      currentExpiry.setHours(0, 0, 0, 0);

      if (currentExpiry >= today) {
        wasActive = true;
        defaultStartDate = new Date(currentExpiry);
        defaultStartDate.setDate(defaultStartDate.getDate() + 1);
      }
    }

    let startFrom = defaultStartDate;

    if (newStartDate) {
      const selectedStartDate = new Date(`${newStartDate}T12:00:00`);

      if (Number.isNaN(selectedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid renewal start date.",
        });
      }

      selectedStartDate.setHours(0, 0, 0, 0);
      startFrom = selectedStartDate;
    }

    const newExpiry = new Date(startFrom);
    newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

    const newSubscription = await MemberSubscriptionHistory.create({
      member: member._id,
      plan,
      joiningDate: startFrom,
      expiryDate: newExpiry,
      planAmount: Number(extensionAmount || 0),
      admissionType: admissionType === "offer" ? "offer" : "normal",
      offerName: admissionType === "offer" ? String(offerName || "").trim() : "",
      discount: admissionType !== "offer" ? Number(discount || 0) : 0,
      balance: Number(balanceAmount || 0),
      activities: Array.isArray(activities)
        ? activities
        : latestSub?.activities || [],
      wasActive,
      createdBy: req.user._id,
    });

    if (Number(amountPayingToday) > 0) {
      await MemberPaymentHistory.create({
        memberSubscription: newSubscription._id,
        amountPaid: Number(amountPayingToday),
        paymentMode: paymentMode || "upi",
        paymentDate: today,
        remarks: "Membership renewal payment",
      });
    }

    await pruneOldSubscriptionHistory(member._id);

    const formatted = await formatMember(member);
    emitToGym(req.user.gymId, "member:updated", { member: formatted });

    (async () => {
      let headerMediaId = null;
      let gymName = "";

      try {
        const gymDoc = await Gym.findById(req.user.gymId).select(
          "gymName gstNumber whatsappIntegration.connected whatsappAutomationSettings.enabled whatsappAutomationSettings.extendRenewal +whatsappIntegration.accessToken"
        );

        if (gymDoc) {
          gymName = gymDoc.gymName || "";
          const automationLive =
            gymDoc?.whatsappIntegration?.connected &&
            gymDoc?.whatsappAutomationSettings?.enabled &&
            gymDoc?.whatsappAutomationSettings?.extendRenewal?.enabled;

          if (automationLive) {
            const pdfBuffer = await generateInvoicePdf({
              gym: gymDoc,
              member: { name: member.name, mobile: member.mobile, plan },
              subscription: {
                planAmount: extensionAmount,
                plan,
                joiningDate: startFrom,
              },
            });

            const uploadResult = await uploadWhatsappMedia({
              gym: gymDoc,
              fileBuffer: pdfBuffer,
              filename: "invoice.pdf",
            });

            if (uploadResult.success) {
              headerMediaId = uploadResult.mediaId;
            } else {
              console.error("❌ Renewal invoice upload failed:", uploadResult.error);
            }
          }
        }

        const automationResult = await triggerMemberAutomation({
          gymId: req.user.gymId,
          automationKey: "extendRenewal",
          toPhone: member.mobile,
          templateParams: [
            String(member.name || "Member"),
            `${monthsToAdd} Month${monthsToAdd > 1 ? "s" : ""}`,
            wasActive ? "extended" : "renewed",
          ],
          headerMediaId,
        });

        console.log("Extend automation response:", automationResult);
      } catch (error) {
        console.error("Renewal invoice generation failed:", error);
      }
    })();

    return res.status(200).json({
      success: true,
      message: "Membership renewed successfully.",
      member: formatted,
    });
  } catch (error) {
    console.error("extendMembership error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to renew membership.",
    });
  }
};