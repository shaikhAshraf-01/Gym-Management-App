// Opens a WhatsApp chat with ONE member (optionally with a pre-filled
// message). This is the single place every WhatsApp button in the app
// goes through — MembersView, MemberProfileModal, WhatsAppMessagePopup
// and WhatsAppRenewMessagePopup — so the behaviour is fixed once.
//
// ---------------------------------------------------------------
// What was wrong before
// ---------------------------------------------------------------
// 1) "Back to the app -> 2 seconds later it jumps to api.whatsapp.com"
//    The old code opened `whatsapp://...` and then, 1.5s later, forced
//    `window.location.href = https://api.whatsapp.com/...` from a
//    setTimeout as a "fallback". When WhatsApp opens, the app is
//    backgrounded and its timers are PAUSED; the moment the user comes
//    back, the paused timer fires and drags the whole app to the
//    browser link. WhatsAppMessagePopup had no way to cancel it at all.
//
// 2) It happened on PC too
//    The old check was `UA is mobile || window.Capacitor`. Importing
//    @capacitor/core defines window.Capacitor in EVERY browser, so a
//    desktop browser was treated as "mobile" and ran the same
//    whatsapp:// + timer + redirect flow. The right check is
//    Capacitor.isNativePlatform() (true only inside the APK).
//
// 3) New tab on every click on PC
//    Desktop used window.open(url, "someName") expecting the same tab
//    to be reused. WhatsApp Web sends the header
//    `Cross-Origin-Opener-Policy: same-origin-allow-popups`, which makes
//    Chrome treat each load as a new browsing context group, so the
//    named tab is never found again (Chromium issue 336222177). A
//    website cannot work around this.
//
// ---------------------------------------------------------------
// How it works now
// ---------------------------------------------------------------
// APK (Capacitor)    -> one navigation to whatsapp://send?... . Capacitor
//                       hands it to Android as an intent. No timer, so
//                       nothing can fire after the user comes back.
// Mobile browser/PWA -> one navigation to https://api.whatsapp.com/send
//                       (an app link: opens the WhatsApp app, or the web
//                       page if it isn't installed). No timer.
// PC (Chrome/Edge)   -> first tries the WhatsApp DESKTOP app via
//                       whatsapp://send?... — it opens that exact chat
//                       inside the app, no browser tab at all. If the
//                       app doesn't take focus within ~1.8s, falls back
//                       to WhatsApp Web (web.whatsapp.com/send, which
//                       opens the chat directly) and remembers that for
//                       the rest of the browser session, so later clicks
//                       open the web chat instantly.
// PC (other browsers)-> WhatsApp Web directly.

import { Capacitor } from "@capacitor/core";

const WEB_TAB_NAME = "GymOpsFlowWhatsApp";
const DESKTOP_APP_WAIT_MS = 1800;
// If our timer fires much later than scheduled, the page was frozen /
// backgrounded in the meantime (the app or a dialog took over) — treat
// that as "the app opened" and do NOT fall back.
const TIMER_LATE_TOLERANCE_MS = 1200;
const SESSION_KEY = "gymopsflow_wa_desktop_app_unavailable";

const readSessionFlag = () => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

const writeSessionFlag = () => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // storage blocked — fine, we just retry the app next time
  }
};

const isMobileBrowser = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

// Chrome / Edge handle unknown custom protocols silently. Firefox and
// Safari can show a "choose application" dialog or an error instead, so
// they skip the desktop-app attempt and go straight to WhatsApp Web.
const isChromiumDesktop = () => {
  const ua = navigator.userAgent || "";
  return /Chrome\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
};

const openWebChat = (webUrl) => {
  // Same name every time. Where the browser allows it the existing tab
  // is reused; WhatsApp Web's COOP header prevents that in Chromium, in
  // which case this is simply one new tab with the chat already open.
  window.open(webUrl, WEB_TAB_NAME);
};

const openOnDesktop = (nativeUrl, webUrl) => {
  if (!isChromiumDesktop() || readSessionFlag()) {
    openWebChat(webUrl);
    return;
  }

  const startedAt = Date.now();
  let timer = null;

  const stopWatching = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    window.removeEventListener("blur", onAppTookOver);
    document.removeEventListener("visibilitychange", onAppTookOver);
  };

  // The desktop app (or Chrome's "Open WhatsApp?" prompt) took focus —
  // the deep link worked, so no web fallback.
  function onAppTookOver() {
    stopWatching();
  }

  window.addEventListener("blur", onAppTookOver);
  document.addEventListener("visibilitychange", onAppTookOver);

  // Chrome shows nothing and stays on the page if no app is registered
  // for the scheme, so navigating here is safe.
  window.location.href = nativeUrl;

  timer = setTimeout(() => {
    timer = null;
    stopWatching();

    const wasFrozen = Date.now() - startedAt > DESKTOP_APP_WAIT_MS + TIMER_LATE_TOLERANCE_MS;
    if (wasFrozen) return;

    writeSessionFlag();
    openWebChat(webUrl);
  }, DESKTOP_APP_WAIT_MS);
};

// mobile: 10-digit Indian number (country code 91 is added here).
// text:   optional message to pre-fill in the chat.
export const openWhatsAppChat = (mobile, text = "") => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const phone = `91${cleanPhone}`;
  const textQuery = text ? `&text=${encodeURIComponent(text)}` : "";

  const nativeUrl = `whatsapp://send?phone=${phone}${textQuery}`;
  const apiUrl = `https://api.whatsapp.com/send?phone=${phone}${textQuery}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${phone}${textQuery}`;

  // Inside the Android app (APK).
  if (Capacitor.isNativePlatform()) {
    window.location.href = nativeUrl;
    return;
  }

  // Phone / tablet browser or installed PWA.
  if (isMobileBrowser()) {
    window.location.href = apiUrl;
    return;
  }

  // PC.
  openOnDesktop(nativeUrl, webUrl);
};