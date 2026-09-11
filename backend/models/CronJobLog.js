import mongoose from "mongoose";

// One row per scheduled job (e.g. "expiryReminder"). We only need to
// know "did this job already run today?" — not a full history — so
// this stays a single upserted document per job, not a growing log.
const cronJobLogSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      unique: true,
    },
    // "YYYY-MM-DD" (local calendar date the job last completed for).
    lastRunDate: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CronJobLog = mongoose.model("CronJobLog", cronJobLogSchema);
export default CronJobLog;