// AES-256-GCM field-level encryption for sensitive strings stored at
// rest (currently: Gym.whatsappIntegration.accessToken). Uses Node's
// built-in `crypto` — no extra npm package needed.
//
// Setup (one-time): generate a 32-byte key and add it to your .env —
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//   FIELD_ENCRYPTION_KEY=<the 64-char hex string it prints>
//
// Wired in as a Mongoose `set`/`get` on the schema path itself (see
// models/Gym.js), so every existing read/write site in the codebase
// gets encryption transparently — nothing else needed to change.

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM
const AUTH_TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

let cachedKey; // undefined = not looked up yet, null = looked up & invalid/missing

const getKey = () => {
  if (cachedKey !== undefined) return cachedKey;

  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    cachedKey = null;
    return cachedKey;
  }

  const key = Buffer.from(raw, "hex");
  cachedKey = key.length === 32 ? key : null;

  if (!cachedKey) {
    console.error(
      "FIELD_ENCRYPTION_KEY is set but isn't a valid 32-byte hex string " +
        "(expected 64 hex characters). Field encryption will fail until this is fixed."
    );
  }

  return cachedKey;
};

// Encrypts a plain string for storage. Empty/null/undefined pass through
// unchanged (an empty accessToken just means "not connected" — nothing
// sensitive to protect). Throws if no valid key is configured, rather
// than silently falling back to storing plaintext.
export const encryptField = (value) => {
  if (value === "" || value === null || value === undefined) return value;

  // Already encrypted — Mongoose only reruns a path's setter when that
  // path is reassigned, so this guards against ever double-encrypting
  // if some future code re-saves an already-encrypted value.
  if (typeof value === "string" && value.startsWith(PREFIX)) return value;

  const key = getKey();
  if (!key) {
    throw new Error(
      "Cannot save: FIELD_ENCRYPTION_KEY is missing or invalid on the server. " +
        "See backend/utils/fieldEncryption.js for setup."
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, authTag, ciphertext]).toString("base64");
};

// Decrypts a stored value back to plaintext for use in code (e.g.
// building the Meta API request). A value that isn't in our encrypted
// format is returned as-is — this covers rows written before this
// feature existed, so old plaintext tokens keep working until the next
// time they're saved (which re-encrypts them via encryptField above).
export const decryptField = (value) => {
  if (!value || typeof value !== "string") return value;
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext

  const key = getKey();
  if (!key) {
    console.error("FIELD_ENCRYPTION_KEY is missing — cannot decrypt a stored token.");
    return null;
  }

  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (err) {
    console.error("Failed to decrypt stored field:", err.message);
    return null;
  }
};

// True once stored in our encrypted format — used by the one-off
// migration script to skip rows that are already encrypted.
export const isEncrypted = (value) =>
  typeof value === "string" && value.startsWith(PREFIX);