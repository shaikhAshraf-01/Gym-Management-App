import React, { useEffect, useState } from "react";
import { MessageCircle, X, Send, Phone } from "lucide-react";

export default function WhatsAppMessagePopup({
  isOpen,
  onClose,
  phone,
  gymName,
  plan,
  durationMonths,
  amount,
  customMessage,
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (customMessage !== undefined) {
      setMessage(customMessage);
      return;
    }

    const generatedMessage = `Hello ${gymName},

Your subscription has been successfully activated for ${durationMonths} month(s).

Plan: ${plan}
Duration: ${durationMonths} month(s)
Amount: ₹${amount}

Thank you for choosing GymOpsFlow 💪
We’re happy to have you with us.`;

    setMessage(generatedMessage);
  }, [isOpen, gymName, plan, durationMonths, amount, customMessage]);

  if (!isOpen) return null;

  const cleanPhone = String(phone || "").replace(/\D/g, "");

  const handleOpenWhatsApp = () => {
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("Invalid WhatsApp mobile number.");
      return;
    }

    const finalPhone = `91${cleanPhone}`;
    const encodedText = encodeURIComponent(message);

    // ✅ APK support ke liye internal application scheme set kiya
    const nativeAppUrl = `whatsapp://send?phone=${finalPhone}&text=${encodedText}`;
    
    // ✅ Fallback — WhatsApp ka official click-to-chat endpoint
    // (api.whatsapp.com). wa.me isi pe redirect karta hai, lekin yeh
    // direct hone ki wajah se Capacitor/webview me zyada reliably
    // WhatsApp app link ke through intercept hota hai.
    const browserFallbackUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;

    // Detect if running inside Capacitor shell or typical mobile browser wrapper
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.Capacitor;

    if (isMobile) {
      // Direct intent protocol to load installed native WhatsApp
      window.location.href = nativeAppUrl;

      // Agar system response slow ho ya app na miley, fallback handle karega
      setTimeout(() => {
        window.location.href = browserFallbackUrl;
      }, 1500);
    } else {
      window.open(browserFallbackUrl, "FitZoneWhatsAppTab");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Send WhatsApp Message
              </h2>
              <p className="text-xs text-slate-500">
                {customMessage !== undefined ? "Membership confirmation" : "Subscription confirmation"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 bg-red-50 text-red-600 border border-red-200 transition hover:bg-red-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {/* Recipient */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              WhatsApp Number
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <Phone className="h-4 w-4 text-slate-400" />

              <span className="text-sm font-medium text-slate-700">
                +91 {cleanPhone}
              </span>
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">
                Message
              </label>

              <span className="text-[11px] text-slate-400">
                You can edit this message
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base leading-7 text-slate-700 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}