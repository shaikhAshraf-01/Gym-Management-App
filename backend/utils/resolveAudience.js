import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import Inquiry from "../models/Inquiry.js";

// audience: "all_members" | "active_members" | "inactive_members" | "all_members_and_enquiries"
export const resolveAudience = async (gymId, audience) => {
  const members = await Member.find({ gym: gymId }).select("_id name mobile");

  if (audience === "all_members") {
    return members.map((m) => ({ name: m.name, mobile: m.mobile }));
  }

  if (audience === "all_members_and_enquiries") {
    const enquiries = await Inquiry.find({ gym: gymId }).select("name mobile");
    return [
      ...members.map((m) => ({ name: m.name, mobile: m.mobile })),
      ...enquiries.map((e) => ({ name: e.name, mobile: e.mobile })),
    ];
  }

  // active_members / inactive_members — need each member's LATEST
  // subscription's expiryDate compared to today.
  if (members.length === 0) return [];

  const today = new Date();
  const memberIds = members.map((m) => m._id);

  const latestSubs = await MemberSubscriptionHistory.aggregate([
    { $match: { member: { $in: memberIds } } },
    { $sort: { expiryDate: -1 } },
    { $group: { _id: "$member", doc: { $first: "$$ROOT" } } },
  ]);
  const latestExpiryByMember = new Map(
    latestSubs.map((s) => [String(s._id), s.doc.expiryDate])
  );

  return members
    .filter((m) => {
      const expiryDate = latestExpiryByMember.get(String(m._id));
      // No subscription history at all counts as inactive.
      const isActive = expiryDate ? new Date(expiryDate) >= today : false;
      return audience === "active_members" ? isActive : !isActive;
    })
    .map((m) => ({ name: m.name, mobile: m.mobile }));
};