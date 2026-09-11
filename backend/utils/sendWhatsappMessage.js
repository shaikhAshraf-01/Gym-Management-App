// ================= WHATSAPP CLOUD API — CORE SEND ENGINE =================
// Every automation (expiry reminder, welcome, extend/renew, balance
// reminder/confirmation, offers) funnels through this one function.
// It sends on behalf of the GYM'S OWN connected WhatsApp Business
// Account (gym.whatsappIntegration) — we never send from our own
// number, and each gym is billed by Meta directly for their usage.
//
// Requires: gym.whatsappIntegration.connected, .phoneNumberId,
// .accessToken (this field has `select:false` in the schema, so the
// gym document passed in here MUST be fetched with
// .select("+whatsappIntegration.accessToken") or it will be empty.

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

// Sends an already-Meta-approved template message.
// templateParams: array of strings filled into the template's {{1}}, {{2}}... placeholders.
// mediaUrl/mediaId: optional, for templates with a header document (e.g. invoice PDF).
export const sendWhatsappTemplateMessage = async ({
  gym,
  toPhone,
  templateName,
  languageCode = "en",
  templateParams = [],
  headerMediaId = null,
}) => {
  if (!gym?.whatsappIntegration?.connected) {
    return { success: false, error: "WhatsApp Business Account not connected for this gym." };
  }
  if (!templateName) {
    return { success: false, error: "No template configured for this automation." };
  }

  const { phoneNumberId, accessToken } = gym.whatsappIntegration;
  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "Missing WhatsApp credentials on the gym record." };
  }

  const cleanPhone = String(toPhone || "").replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    return { success: false, error: "Invalid recipient mobile number." };
  }

  const components = [];
  if (headerMediaId) {
    components.push({
      type: "header",
      parameters: [{ type: "document", document: { id: headerMediaId } }],
    });
  }
  if (templateParams.length > 0) {
    components.push({
      type: "body",
      parameters: templateParams.map((text) => ({ type: "text", text: String(text) })),
    });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `91${cleanPhone}`,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(components.length > 0 ? { components } : {}),
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp send failed:", data);
      return {
        success: false,
        error: data?.error?.message || "WhatsApp API rejected the message.",
      };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error: "Could not reach WhatsApp API." };
  }
};

// Uploads a PDF (e.g. an invoice) to Meta's media endpoint so its
// media_id can be used as a template's document header. Needs the
// file as a Buffer (e.g. straight from jsPDF's output in Node).
export const uploadWhatsappMedia = async ({ gym, fileBuffer, filename }) => {
  if (!gym?.whatsappIntegration?.connected) {
    return { success: false, error: "WhatsApp Business Account not connected for this gym." };
  }

  const { phoneNumberId, accessToken } = gym.whatsappIntegration;

  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", new Blob([fileBuffer], { type: "application/pdf" }), filename || "invoice.pdf");

    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp media upload failed:", data);
      return { success: false, error: data?.error?.message || "Media upload failed." };
    }

    return { success: true, mediaId: data.id };
  } catch (error) {
    console.error("WhatsApp media upload error:", error);
    return { success: false, error: "Could not reach WhatsApp API." };
  }
};

// ================= AUTOMATION TRIGGER (used by member hooks) =================
// One entry point for every scheduled/event-driven automation
// (expiryReminder, memberWelcome, extendRenewal, balanceConfirmation).
// Checks the master switch + that specific automation's toggle +
// that the gym actually has a connected account, then sends.
//
// Fire-and-forget by design: callers should NOT await this inline in
// a request handler in a way that could fail the member-create/renew
// response — wrap the call in its own try/catch and ignore the
// result (or just log it), same as the addMember/extendMembership
// hooks below do.
//
// automationKey: "expiryReminder" | "memberWelcome" | "extendRenewal" | "balanceConfirmation" | "balanceReminder"
export const triggerMemberAutomation = async ({
  gymId,
  automationKey,
  toPhone,
  templateParams = [],
  headerMediaId = null,
}) => {
  try {
    // Local import to avoid a circular import between Gym.js and this
    // file at module-load time.
    const { default: Gym } = await import("../models/Gym.js");

    const gym = await Gym.findById(gymId).select("+whatsappIntegration.accessToken");
    if (!gym) return { success: false, error: "Gym not found." };

    const settings = gym.whatsappAutomationSettings;
    const automation = settings?.[automationKey];

    if (!settings?.enabled || !automation?.enabled || !gym.whatsappIntegration?.connected) {
      // Not an error — automation is simply off. Silent no-op.
      return { success: false, skipped: true };
    }

    return await sendWhatsappTemplateMessage({
      gym,
      toPhone,
      templateName: automation.templateName,
      templateParams,
      headerMediaId,
    });
  } catch (error) {
    console.error(`triggerMemberAutomation(${automationKey}) error:`, error);
    return { success: false, error: "Automation trigger failed." };
  }
};