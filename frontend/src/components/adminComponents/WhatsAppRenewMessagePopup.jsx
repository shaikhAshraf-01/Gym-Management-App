import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send, Phone } from "lucide-react";

export default function WhatsAppRenewalMessagePopup({
  isOpen,
  onClose,
  phone,
  gymName,
  plan,
  months,
  amount,
  newEndDate,
  // Optional: pass a fully-built message to skip the auto-generation
  // below. Existing callers that don't pass this keep working exactly
  // as before.
  customMessage,
}) {
 
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (customMessage !== undefined) {
      setMessage(customMessage);
      return;
    }

    const renewalMessage = `Hello ${gymName},

Your subscription has been successfully renewed.

Plan: ${plan}
Renewed for: ${months} ${months === 1 ? "month" : "months"}
Amount: ₹${Number(amount || 0).toLocaleString("en-IN")}
New expiry date: ${newEndDate}

Thank you for continuing with GymOpsFlow 💪`;

    setMessage(renewalMessage);
  }, [isOpen, gymName, plan, months, amount, newEndDate, customMessage]);

  if (!isOpen) return null;

  const cleanPhone = String(phone || "").replace(/\D/g, "");

  const handleOpenWhatsApp = () => {
    if (cleanPhone.length !== 10) {
      alert("Invalid WhatsApp mobile number.");
      return;
    }

    const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Navigating the CURRENT tab to wa.me lets the OS hand off to
      // the native WhatsApp app directly — no new tab, and if
      // WhatsApp isn't installed wa.me falls back gracefully instead
      // of a dead "can't open page" error (which a hand-rolled
      // whatsapp:// scheme link would show with no fallback).
      window.location.href = waLink;
    } else {
      // Named target = the SAME tab gets reused on every click
      // instead of a new one opening each time.
      window.open(waLink, "FitZoneWhatsAppTab");
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-100 isolate h-dvh min-h-svh w-full overflow-y-auto overscroll-contain bg-black/50 p-3 sm:p-4 [touch-action:pan-y]">
      <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Renewal Successful
              </h2>

              <p className="text-xs text-slate-500">
                Send renewal confirmation on WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 bg-red-50 text-red-600 border border-red-200 transition hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
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
                Renewal Message
              </label>

              <span className="text-[11px] text-slate-400">
                You can edit this message
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-row gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-200 sm:flex-none"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700 sm:flex-none"
          >
            <Send className="h-4 w-4" />
            Open WhatsApp
          </button>
        </div>
      </div>
      </div>
    </div>
  ), document.body);
}