// ---------------------------------------------------------------------
// Meta calls this endpoint two ways:
//
// 1. GET  — ONE-TIME verification handshake, happens when you paste the
//    Callback URL + Verify Token into the Meta App Dashboard and click
//    "Verify and Save". Meta sends hub.mode, hub.verify_token, and
//    hub.challenge as query params. If our token matches, we must echo
//    back hub.challenge as plain text (not JSON) — that's the whole
//    handshake.
//
// 2. POST — ongoing, every time something happens on a connected
//    WhatsApp number: incoming customer messages, message status
//    updates (sent/delivered/read/failed), embedded-signup completion
//    events, etc. For now we just log the payload — once
//    templates/sending are built we'll route these to update message
//    status in the DB.
// ---------------------------------------------------------------------

export const verifyWhatsAppWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified by Meta.");
    return res.status(200).send(challenge);
  }

  console.warn("❌ WhatsApp webhook verification failed — token mismatch.");
  return res.sendStatus(403);
};

export const receiveWhatsAppEvent = (req, res) => {
  // Meta expects a fast 200 OK — always ack immediately, then process.
  // If we ever throw/hang here, Meta will retry and eventually disable
  // the webhook.
  try {
    const body = req.body;

    // TODO once messaging is built: parse body.entry[].changes[].value
    // for statuses[] (sent/delivered/read/failed) and messages[]
    // (incoming replies), then update MessageLog / trigger handlers.
    console.log("📩 WhatsApp webhook event:", JSON.stringify(body, null, 2));

    return res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook processing error:", error.message);
    // Still 200 — Meta doesn't care about our internal errors, and
    // returning non-200 just triggers pointless retries.
    return res.sendStatus(200);
  }
};