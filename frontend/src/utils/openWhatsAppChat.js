// Opens a plain WhatsApp chat with a member (no template, no plan
// gating — just a deep link). Shared by MembersView.jsx and
// MemberProfileModal.jsx so this fix lives in exactly one place.
//
// The bug this fixes: on mobile, we try the native app link first
// (`whatsapp://...`) and, ONLY if that fails, fall back to the browser
// link (`https://api.whatsapp.com/...`) after a short delay. That
// fallback used a bare setTimeout with nothing to cancel it — so if
// WhatsApp opened successfully and the person came straight back
// (well within the delay, which easily happens on a fast phone), our
// app's tab was still sitting there with that timer ticking. The
// instant it fired, it force-navigated to the browser fallback URL —
// which is exactly the "goes to WhatsApp, I hit back, then it jumps
// to the Chrome WhatsApp link by itself" symptom.
//
// The fix: cancel the fallback the moment the app is backgrounded —
// that's WhatsApp opening, i.e. the native link worked and no
// fallback is needed. We only let the fallback fire if the app never
// loses focus at all during the delay (deep link failed silently,
// nothing else would have hidden the app).
export const openWhatsAppChat = (mobile) => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const finalPhone = `91${cleanPhone}`;
  const nativeAppUrl = `whatsapp://send?phone=${finalPhone}`;
  const browserFallbackUrl = `https://api.whatsapp.com/send?phone=${finalPhone}`;
  const isMobileDevice =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.Capacitor;

  if (!isMobileDevice) {
    window.open(browserFallbackUrl, "MemberWhatsAppChat");
    return;
  }

  let fallbackTimer = null;

  const cancelFallback = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("blur", onHide);
  };

  const onHide = () => {
    // Any of these firing means the WhatsApp app (or its app-switcher
    // chooser) actually opened — the native link worked, so the
    // browser fallback is no longer needed.
    if (document.hidden) cancelFallback();
  };

  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("blur", onHide);

  window.location.href = nativeAppUrl;

  fallbackTimer = setTimeout(() => {
    fallbackTimer = null;
    cancelFallback();
    window.location.href = browserFallbackUrl;
  }, 1500);
};