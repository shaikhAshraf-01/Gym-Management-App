import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import MemberSubscriptionHistory from "../models/MemberSubscriptionHistory.js";
import CronJobLog from "../models/CronJobLog.js";
import { sendWhatsappTemplateMessage } from "../utils/sendWhatsappMessage.js";

const JOB_NAME = "expiryReminder";

// Local calendar date as "YYYY-MM-DD" — used purely to answer
// "has this job already run today?", so it doesn't need to be
// timezone-perfect, just consistent.
const todayDateString = () => new Date().toISOString().split("T")[0];

const startEndOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return [start, end];
};

// ================= THE ACTUAL WORK =================
// Runs unconditionally — callers decide WHETHER to call it (see
// ensureExpiryReminderRanToday below). One gym failing (bad token,
// Meta API hiccup) never stops the rest from being processed.
export const runExpiryReminderJob = async () => {
  console.log(`[cron] ${JOB_NAME}: starting...`);

  const eligibleGyms = await Gym.find({
    "whatsappAutomationSettings.enabled": true,
    "whatsappAutomationSettings.expiryReminder.enabled": true,
    "whatsappIntegration.connected": true,
  }).select("+whatsappIntegration.accessToken");

  let sentCount = 0;

  for (const gym of eligibleGyms) {
    try {
      const { daysBefore, templateName } = gym.whatsappAutomationSettings.expiryReminder;

      const target = new Date();
      target.setDate(target.getDate() + (daysBefore || 3));
      const [targetStart, targetEnd] = startEndOfDay(target);

      const members = await Member.find({ gym: gym._id }).select("_id name mobile");
      if (members.length === 0) continue;

      const memberById = new Map(members.map((m) => [String(m._id), m]));

      // Latest subscription per member, filtered to ones expiring on
      // the target date.
      const dueSubs = await MemberSubscriptionHistory.aggregate([
        { $match: { member: { $in: members.map((m) => m._id) } } },
        { $sort: { expiryDate: -1 } },
        { $group: { _id: "$member", doc: { $first: "$$ROOT" } } },
        { $match: { "doc.expiryDate": { $gte: targetStart, $lte: targetEnd } } },
      ]);

      for (const entry of dueSubs) {
        const member = memberById.get(String(entry._id));
        if (!member) continue;

        const result = await sendWhatsappTemplateMessage({
          gym,
          toPhone: member.mobile,
          templateName,
          templateParams: [member.name, String(daysBefore || 3)],
        });

        if (result.success) {
          sentCount++;
        } else {
          console.error(
            `[cron] ${JOB_NAME}: failed for member ${member._id} (gym ${gym._id}):`,
            result.error
          );
        }
      }
    } catch (error) {
      console.error(`[cron] ${JOB_NAME}: gym ${gym._id} failed:`, error);
      // Keep going — don't let one gym's error stop the others.
    }
  }

  await CronJobLog.findOneAndUpdate(
    { jobName: JOB_NAME },
    { lastRunDate: todayDateString() },
    { upsert: true }
  );

  console.log(`[cron] ${JOB_NAME}: done. ${sentCount} reminder(s) sent.`);
};

// ================= THE SAFETY NET =================
// Call this from BOTH the daily node-cron schedule AND once at
// server startup (server.js). If today's run already happened,
// this is a single cheap DB read and nothing else — so calling it
// an "extra" time on startup is harmless. If it HASN'T run yet
// (e.g. the server was asleep — free tier — when the scheduled
// hour hit, and only woke up later), it runs now instead of
// silently skipping the day.
export const ensureExpiryReminderRanToday = async () => {
  try {
    const log = await CronJobLog.findOne({ jobName: JOB_NAME });
    if (log?.lastRunDate === todayDateString()) {
      return; // Already done today — nothing to do.
    }
    await runExpiryReminderJob();
  } catch (error) {
    console.error(`[cron] ${JOB_NAME}: catch-up check failed:`, error);
  }
};