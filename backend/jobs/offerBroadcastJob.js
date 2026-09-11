import Gym from "../models/Gym.js";
import GymOffer from "../models/GymOffer.js";
import CronJobLog from "../models/CronJobLog.js";
import { resolveAudience } from "../utils/resolveAudience.js";
import { sendWhatsappTemplateMessage } from "../utils/sendWhatsappMessage.js";

const JOB_NAME = "offerBroadcast";

const todayDateString = () => new Date().toISOString().split("T")[0];

const endOfToday = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

// ================= THE ACTUAL WORK =================
// Picks up every still-"scheduled" offer whose date has arrived —
// intentionally <= end-of-today rather than "== today", so an offer
// that was due yesterday (server was asleep, or this job's run was
// somehow missed) still goes out today instead of being stuck
// forever in "scheduled".
export const runOfferBroadcastJob = async () => {
  console.log(`[cron] ${JOB_NAME}: starting...`);

  const dueOffers = await GymOffer.find({
    status: "scheduled",
    scheduledDate: { $lte: endOfToday() },
  });

  for (const offer of dueOffers) {
    try {
      const gym = await Gym.findById(offer.gym).select("+whatsappIntegration.accessToken");

      if (!gym?.whatsappIntegration?.connected) {
        offer.status = "failed";
        await offer.save();
        continue;
      }

      const recipients = await resolveAudience(gym._id, offer.audience);

      let sent = 0;
      let failed = 0;
      for (const recipient of recipients) {
        const result = await sendWhatsappTemplateMessage({
          gym,
          toPhone: recipient.mobile,
          templateName: offer.templateName,
          templateParams: [recipient.name],
        });
        result.success ? sent++ : failed++;
      }

      offer.status = "sent";
      offer.sentCount = sent;
      offer.failedCount = failed;
      await offer.save();
    } catch (error) {
      console.error(`[cron] ${JOB_NAME}: offer ${offer._id} failed:`, error);
      try {
        offer.status = "failed";
        await offer.save();
      } catch (_) {
        // best-effort — don't let a save failure crash the loop
      }
    }
  }

  await CronJobLog.findOneAndUpdate(
    { jobName: JOB_NAME },
    { lastRunDate: todayDateString() },
    { upsert: true }
  );

  console.log(`[cron] ${JOB_NAME}: done. ${dueOffers.length} offer(s) processed.`);
};

// ================= THE SAFETY NET =================
// Same pattern as expiryReminderJob's — call at server startup so a
// free-tier sleep around the scheduled hour never silently skips
// sending a due offer.
export const ensureOfferBroadcastRanToday = async () => {
  try {
    const log = await CronJobLog.findOne({ jobName: JOB_NAME });
    if (log?.lastRunDate === todayDateString()) {
      return;
    }
    await runOfferBroadcastJob();
  } catch (error) {
    console.error(`[cron] ${JOB_NAME}: catch-up check failed:`, error);
  }
};