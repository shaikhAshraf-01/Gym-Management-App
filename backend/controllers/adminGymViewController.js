import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import MemberPaymentHistory from "../models/MemberPaymentHistory.js";
import Inquiry from "../models/Inquiry.js";
import {
  toDateStr,
  todayIST,
  escapeRegex,
  buildLatestSubMap,
  buildSaleEntries,
  summarizeSales,
  monthKeyOf,
  previousMonthKey,
} from "../utils/gymViewHelpers.js";

// ---------------------------------------------------------------------
// Read-only admin views of ONE gym's data (members, enquiries, sales).
// Admin never edits this data — it belongs to the gym owner.
// ---------------------------------------------------------------------

// Validates :id and makes sure the gym exists. Sends the error response
// itself and returns null when something is wrong.
const resolveGymId = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: "Invalid gym id." });
    return null;
  }

  const exists = await Gym.exists({ _id: id });
  if (!exists) {
    res.status(404).json({ success: false, message: "Gym not found." });
    return null;
  }

  return new mongoose.Types.ObjectId(id);
};

// Loads a gym's (non-deleted) members plus all their subscriptions and
// payments in 3 queries. Everything after that is plain JS.
const loadGymData = async (gymId) => {
  const members = await Member.find({ gym: gymId, isDeleted: { $ne: true } })
    .select("name mobile gender age createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const memberIds = members.map((m) => m._id);
  const memberMap = new Map(members.map((m) => [String(m._id), m]));

  const subs = memberIds.length
    ? await MemberSubscriptionHistory.find({ member: { $in: memberIds } }).lean()
    : [];

  const pays = subs.length
    ? await MemberPaymentHistory.find({
        memberSubscription: { $in: subs.map((s) => s._id) },
      }).lean()
    : [];

  return { members, memberMap, subs, pays };
};

const pageParams = (req, defaultLimit = 20) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit };
};

// ===== GET /admin/gyms/:id/overview =====
export const getGymOverview = async (req, res) => {
  try {
    const gymId = await resolveGymId(req, res);
    if (!gymId) return;

    const { members, memberMap, subs, pays } = await loadGymData(gymId);
    const latestMap = buildLatestSubMap(subs);
    const today = todayIST();

    let active = 0;
    let expired = 0;
    let noPlan = 0;
    let pendingBalance = 0;
    let lastMemberAddedAt = null;

    for (const m of members) {
      const latest = latestMap.get(String(m._id));
      if (!latest) {
        noPlan += 1;
      } else {
        if (toDateStr(latest.expiryDate) >= today) active += 1;
        else expired += 1;
        pendingBalance += Number(latest.balance || 0);
      }
      if (!lastMemberAddedAt || m.createdAt > lastMemberAddedAt) {
        lastMemberAddedAt = m.createdAt;
      }
    }

    const entries = buildSaleEntries({ subs, pays, memberMap });
    const thisMonthKey = monthKeyOf(today);
    const lastMonthKey = previousMonthKey(today);
    const sumFor = (rows) => rows.reduce((s, e) => s + e.amount, 0);

    const lastSaleDate = entries.reduce(
      (max, e) => (!max || e.date > max ? e.date : max),
      null
    );

    const [enquiryCount, lastEnquiry, deletedMembers] = await Promise.all([
      Inquiry.countDocuments({ gym: gymId }),
      Inquiry.findOne({ gym: gymId }).sort({ createdAt: -1 }).select("createdAt").lean(),
      Member.countDocuments({ gym: gymId, isDeleted: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        members: {
          total: members.length,
          active,
          expired,
          noPlan,
          deleted: deletedMembers,
          pendingBalance,
          lastAddedAt: lastMemberAddedAt,
        },
        enquiries: {
          total: enquiryCount,
          lastAt: lastEnquiry?.createdAt || null,
        },
        sales: {
          thisMonth: sumFor(entries.filter((e) => monthKeyOf(e.date) === thisMonthKey)),
          lastMonth: sumFor(entries.filter((e) => monthKeyOf(e.date) === lastMonthKey)),
          lifetime: sumFor(entries),
          lastSaleDate,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load gym overview." });
  }
};

// ===== GET /admin/gyms/:id/members?search=&status=all|active|expired&page=&limit= =====
export const getGymMembers = async (req, res) => {
  try {
    const gymId = await resolveGymId(req, res);
    if (!gymId) return;

    const { page, limit } = pageParams(req);
    const search = String(req.query.search || "").trim().toLowerCase();
    const status = ["active", "expired"].includes(req.query.status)
      ? req.query.status
      : "all";

    const { members, subs } = await loadGymData(gymId);
    const latestMap = buildLatestSubMap(subs);
    const today = todayIST();

    const rows = members.map((m) => {
      const latest = latestMap.get(String(m._id));
      const endDate = latest ? toDateStr(latest.expiryDate) : null;

      return {
        id: String(m._id),
        name: m.name,
        mobile: m.mobile,
        gender: m.gender,
        age: m.age,
        addedAt: m.createdAt,
        plan: latest?.plan || null,
        admissionType: latest?.admissionType || null,
        startDate: latest ? toDateStr(latest.joiningDate) : null,
        endDate,
        balance: Number(latest?.balance || 0),
        status: !latest ? "none" : endDate >= today ? "active" : "expired",
      };
    });

    const counts = {
      all: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      expired: rows.filter((r) => r.status === "expired").length,
    };

    const filtered = rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!search) return true;
      return (
        r.name.toLowerCase().includes(search) || String(r.mobile).includes(search)
      );
    });

    const total = filtered.length;

    return res.status(200).json({
      success: true,
      data: {
        members: filtered.slice((page - 1) * limit, page * limit),
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        counts,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load members." });
  }
};

// ===== GET /admin/gyms/:id/enquiries?search=&page=&limit= =====
export const getGymEnquiries = async (req, res) => {
  try {
    const gymId = await resolveGymId(req, res);
    if (!gymId) return;

    const { page, limit } = pageParams(req);
    const search = String(req.query.search || "").trim();

    const filter = { gym: gymId };
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { mobile: rx }];
    }

    const [total, enquiries] = await Promise.all([
      Inquiry.countDocuments(filter),
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        enquiries: enquiries.map((e) => ({
          id: String(e._id),
          name: e.name,
          mobile: e.mobile,
          willingToJoin: e.willingToJoin || "",
          createdAt: e.createdAt,
        })),
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load enquiries." });
  }
};

// ===== GET /admin/gyms/:id/sales?from=YYYY-MM-DD&to=YYYY-MM-DD =====
export const getGymSales = async (req, res) => {
  try {
    const gymId = await resolveGymId(req, res);
    if (!gymId) return;

    const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
    const from = isDate(req.query.from) ? req.query.from : undefined;
    const to = isDate(req.query.to) ? req.query.to : undefined;

    const { memberMap, subs, pays } = await loadGymData(gymId);
    const entries = buildSaleEntries({ subs, pays, memberMap });

    return res.status(200).json({
      success: true,
      data: summarizeSales(entries, { from, to }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to load sales." });
  }
};