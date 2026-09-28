// Pure helpers for the admin "View Gym" endpoints (no DB access here, so
// the numbers can be unit-tested). The sales maths deliberately mirrors
// what the owner's Sales screen does (memberController.formatMember), so
// admin and owner always see the same figures for a gym:
//   - one entry per subscription
//   - amount = sum of payments collected, falling back to planAmount
//   - date   = date of the last payment, falling back to joiningDate

export const toDateStr = (d) => new Date(d).toISOString().split("T")[0];

// "Today" as an Indian gym owner sees it (IST = UTC+5:30), so a member
// whose plan ends today isn't marked expired by a UTC server clock.
export const todayIST = () =>
  new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// memberId -> that member's latest subscription (by joiningDate, then createdAt)
export const buildLatestSubMap = (subs) => {
  const map = new Map();
  for (const sub of subs) {
    const key = String(sub.member);
    const prev = map.get(key);
    if (
      !prev ||
      new Date(sub.joiningDate) > new Date(prev.joiningDate) ||
      (+new Date(sub.joiningDate) === +new Date(prev.joiningDate) &&
        new Date(sub.createdAt || 0) > new Date(prev.createdAt || 0))
    ) {
      map.set(key, sub);
    }
  }
  return map;
};

export const buildSaleEntries = ({ subs, pays, memberMap }) => {
  const paysBySub = new Map();
  for (const p of pays) {
    const key = String(p.memberSubscription);
    if (!paysBySub.has(key)) paysBySub.set(key, []);
    paysBySub.get(key).push(p);
  }

  return subs.map((sub) => {
    const subPays = (paysBySub.get(String(sub._id)) || []).sort(
      (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)
    );
    const paid = subPays.reduce((s, p) => s + Number(p.amountPaid || 0), 0);
    const last = subPays[subPays.length - 1];
    const member = memberMap.get(String(sub.member)) || {};

    return {
      id: String(sub._id),
      memberName: member.name || "Unknown",
      memberMobile: member.mobile || "",
      plan: sub.plan,
      admissionType: sub.admissionType || "normal",
      offerName: sub.offerName || "",
      amount: paid || Number(sub.planAmount || 0),
      paymentMode: last ? last.paymentMode : "upi",
      date: toDateStr(last ? last.paymentDate : sub.joiningDate),
    };
  });
};

export const groupEntries = (entries, keyFn) => {
  const grouped = {};
  for (const e of entries) {
    const key = keyFn(e);
    if (!grouped[key]) grouped[key] = { key, amount: 0, count: 0 };
    grouped[key].amount += e.amount;
    grouped[key].count += 1;
  }
  return Object.values(grouped).sort((a, b) => b.amount - a.amount);
};

const sum = (entries) => entries.reduce((s, e) => s + e.amount, 0);

export const monthKeyOf = (dateStr) => dateStr.slice(0, 7);

// ["2026-04", ... , "2026-09"] ending at the month of `todayStr`
export const lastNMonthKeys = (n, todayStr) => {
  let [y, m] = todayStr.split("-").map(Number);
  const keys = [];
  for (let i = 0; i < n; i++) {
    keys.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return keys;
};

export const previousMonthKey = (todayStr) => lastNMonthKeys(2, todayStr)[0];

export const summarizeSales = (entries, { from, to } = {}, todayStr = todayIST()) => {
  const inRange = entries.filter(
    (e) => (!from || e.date >= from) && (!to || e.date <= to)
  );

  const byMode = groupEntries(inRange, (e) => e.paymentMode);
  const monthly = lastNMonthKeys(6, todayStr).map((key) => {
    const rows = entries.filter((e) => monthKeyOf(e.date) === key);
    return { month: key, amount: sum(rows), count: rows.length };
  });

  return {
    total: sum(inRange),
    count: inRange.length,
    byMode,
    byPlan: groupEntries(inRange, (e) => e.plan),
    byAdmissionType: groupEntries(inRange, (e) => e.admissionType),
    monthly,
    recent: [...inRange].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50),
  };
};