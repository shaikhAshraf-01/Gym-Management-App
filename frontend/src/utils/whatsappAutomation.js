// Single source of truth for "will the Cloud API automation for this
// event actually fire for this gym right now?" — mirrors the backend rule
// (active Plus/Pro plan + WhatsApp connected + master switch ON + that
// specific automation's own toggle ON).
//
// Where this is TRUE  -> the server sends it, so hide the manual wa.me.
// Where this is FALSE -> show the manual wa.me link (Basic, or Plus/Pro
//                        with that toggle OFF / WhatsApp not connected).
//
// key: "memberWelcome" | "expiryReminder" | "extendRenewal" | "balanceConfirmation"
export const isWhatsappAutomationLive = (subscriptionPlan, gym, key) => {
  const hasAutomationPlan =
    subscriptionPlan === "Plus" || subscriptionPlan === "Pro";

  return (
    hasAutomationPlan &&
    !!gym?.whatsappIntegration?.connected &&
    !!gym?.whatsappAutomationSettings?.enabled &&
    !!gym?.whatsappAutomationSettings?.[key]?.enabled
  );
};