// One-time migration: encrypts any WhatsApp accessToken already sitting
// in the database as plaintext, using the same AES-256-GCM helper the
// app now uses on every future save (see utils/fieldEncryption.js and
// models/Gym.js).
//
// Safe to run more than once — already-encrypted tokens are detected
// and skipped. Safe to run before or after deploying the code change.
//
// Run from backend/:
//   node scripts/encryptExistingTokens.js
//
// Requires the same MONGO_URI and FIELD_ENCRYPTION_KEY your server uses
// (loaded from backend/.env).

import "dotenv/config";
import mongoose from "mongoose";
import { isEncrypted, encryptField } from "../utils/fieldEncryption.js";

// Deliberately NOT importing models/Gym.js here — that schema's
// accessToken field already has the encrypting `set` wired in, which
// would immediately re-encrypt whatever we assign and defeat the
// point of checking "is this already encrypted?" below. Talking to
// the raw collection lets this script see and write exactly what's
// in the database.
const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (check backend/.env).");
    process.exit(1);
  }
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.error("FIELD_ENCRYPTION_KEY is not set (check backend/.env).");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const gyms = mongoose.connection.collection("gyms");

  // Raw collection reads aren't filtered by the schema's select:false,
  // so this sees every gym's real stored value regardless.
  const cursor = gyms.find(
    { "whatsappIntegration.accessToken": { $exists: true, $ne: "" } },
    { projection: { "whatsappIntegration.accessToken": 1 } }
  );

  let checked = 0;
  let encrypted = 0;
  let skippedAlready = 0;

  for await (const gym of cursor) {
    checked += 1;
    const current = gym.whatsappIntegration?.accessToken;

    if (!current || isEncrypted(current)) {
      skippedAlready += 1;
      continue;
    }

    await gyms.updateOne(
      { _id: gym._id },
      { $set: { "whatsappIntegration.accessToken": encryptField(current) } }
    );
    encrypted += 1;
  }

  console.log(
    `Checked ${checked} gym(s) with a token — encrypted ${encrypted}, already encrypted ${skippedAlready}.`
  );

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});