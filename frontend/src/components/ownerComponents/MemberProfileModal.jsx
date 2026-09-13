import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  User as UserIcon,
  UserPlus,
  Hourglass,
  Calendar,
  CalendarX,
  FileText,
} from "lucide-react";
import {
  PLAN_LABELS,
  deleteMember,
  deleteCurrentMembership,
} from "../../redux/slices/membersSlice";

// ---------------------------------------------------------------
// Receipt / Tax Invoice PDF (jsPDF) — built client-side from a single
// membership history entry, then shared via the Web Share API
// (Android/Capacitor share sheet) when available, falling back to a
// plain download.
//
// If the gym has a GSTIN saved (Profile > Gym Details), this renders
// a proper GST tax invoice with a CGST/SGST breakdown (amount is
// treated as GST-inclusive, split at 18% = 9% CGST + 9% SGST — the
// standard slab for fitness/health-club membership services, SAC
// 999723). With no GSTIN, it falls back to a simple (non-GST)
// payment receipt. Both share the same header/footer/table styling.
// ---------------------------------------------------------------
const GST_RATE = 0.18;
const SAC_CODE = "999723"; // Health club and fitness centre services

// Brand palette — matches the app's dark slate + cyan accent theme.
const INK = [15, 23, 42]; // slate-900, header band + total bar
const ACCENT = [34, 211, 238]; // cyan-400, badge + accent lines
const MUTED = [100, 116, 139]; // slate-500, secondary text
const LIGHT_BG = [241, 245, 249]; // slate-100, table header fill
const BORDER = [203, 213, 225]; // slate-300

async function shareReceiptPdf({ gym, member, entry }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a5" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const gstNumber = (gym?.gstNumber || "").trim();
  const isGstInvoice = Boolean(gstNumber);
  const gymName = gym?.gymName || "Gym";
  const totalAmount = Number(entry.amount || 0);
  const money = (n) =>
    `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  // ============== HEADER BAND ==============
  const headerHeight = isGstInvoice ? 92 : 78;
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Badge (top-right, rounded pill)
  const badgeLabel = isGstInvoice ? "TAX INVOICE" : "RECEIPT";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const badgeTextWidth = doc.getTextWidth(badgeLabel);
  const badgeW = badgeTextWidth + 24;
  const badgeH = 22;
  const badgeX = pageWidth - margin - badgeW;
  const badgeY = 24;

  // Gym name
  const nameMaxWidth = badgeX - margin - 12;
  let nameFontSize = 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontSize);
  let displayName = gymName;
  while (nameFontSize > 10 && doc.getTextWidth(displayName) > nameMaxWidth) {
    nameFontSize -= 1;
    doc.setFontSize(nameFontSize);
  }
  if (doc.getTextWidth(displayName) > nameMaxWidth) {
    while (displayName.length > 1 && doc.getTextWidth(`${displayName}…`) > nameMaxWidth) {
      displayName = displayName.slice(0, -1);
    }
    displayName = `${displayName}…`;
  }

  doc.setTextColor(255, 255, 255);
  doc.text(displayName, margin, 38);

  if (isGstInvoice) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`GSTIN: ${gstNumber}`, margin, 56);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(...ACCENT);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 11, 11, "F");
  doc.setTextColor(...INK);
  doc.text(badgeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 3.5, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  let y = headerHeight + 30;

  // ============== META ROW: Billed To / Invoice details ==============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("BILLED TO", margin, y);

  doc.text(isGstInvoice ? "INVOICE NO." : "RECEIPT NO.", pageWidth - margin, y, {
    align: "right",
  });

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  doc.text(member.name || "-", margin, y);
  doc.text(entry.id?.slice(-8)?.toUpperCase() || "-", pageWidth - margin, y, {
    align: "right",
  });

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(member.mobile || "-", margin, y);
  doc.text(`Date: ${entry.date || "-"}`, pageWidth - margin, y, {
    align: "right",
  });

  y += 26;

  // ============== ITEM TABLE ==============
  const col = { desc: margin, period: margin + 220, amt: pageWidth - margin };

  const tableTop = y;
  const headRowH = 22;

  doc.setFillColor(...LIGHT_BG);
  doc.rect(margin, tableTop, contentWidth, headRowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("DESCRIPTION", col.desc + 8, tableTop + 14);
  doc.text("PERIOD", col.period, tableTop + 14);
  doc.text("AMOUNT", col.amt - 8, tableTop + 14, { align: "right" });

  y = tableTop + headRowH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const planLabel = `${PLAN_LABELS[entry.plan] || entry.plan} Membership`;
  doc.text(planLabel, col.desc + 8, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${entry.startDate}`, col.period, y);
  doc.text(`to ${entry.endDate}`, col.period, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(money(totalAmount), col.amt - 8, y, { align: "right" });

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const subLine = isGstInvoice
    ? `Payment mode: ${(entry.paymentMode || "-").toUpperCase()}   •   SAC: ${SAC_CODE}`
    : `Payment mode: ${(entry.paymentMode || "-").toUpperCase()}`;
  doc.text(subLine, col.desc + 8, y);

  y += 10;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.75);
  doc.rect(margin, tableTop, contentWidth, y - tableTop, "S");
  doc.line(margin, tableTop + headRowH, pageWidth - margin, tableTop + headRowH);

  y += 22;

  // ============== GST BREAKUP (invoice only) ==============
  if (isGstInvoice) {
    const taxableValue = totalAmount / (1 + GST_RATE);
    const cgst = taxableValue * (GST_RATE / 2);
    const sgst = taxableValue * (GST_RATE / 2);

    const boxW = 190;
    const boxX = pageWidth - margin - boxW;
    const lineH = 18;
    const boxTop = y;

    const gstRow = (label, value, bold) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(bold ? 0 : MUTED[0], bold ? 0 : MUTED[1], bold ? 0 : MUTED[2]);
      doc.text(label, boxX + 10, y);
      doc.text(money(value), pageWidth - margin - 10, y, { align: "right" });
      y += lineH;
    };

    gstRow("Taxable Value", taxableValue, false);
    gstRow("CGST (9%)", cgst, false);
    gstRow("SGST (9%)", sgst, false);

    doc.setDrawColor(...BORDER);
    doc.rect(boxX, boxTop - 14, boxW, y - boxTop + 4, "S");

    y += 12;
  }

  // ============== TOTAL BAR ==============
  const totalBarH = 34;
  doc.setFillColor(...INK);
  doc.rect(margin, y, contentWidth, totalBarH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(isGstInvoice ? "TOTAL (incl. GST)" : "AMOUNT PAID", margin + 12, y + totalBarH / 2 + 4);
  doc.setFontSize(13);
  doc.text(money(totalAmount), pageWidth - margin - 12, y + totalBarH / 2 + 4.5, {
    align: "right",
  });

  y += totalBarH + 26;
  doc.setTextColor(0, 0, 0);

  // ============== FOOTER ==============
  const footerY = Math.max(y, pageHeight - 56);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 16, pageWidth - margin, footerY - 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    isGstInvoice
      ? "This is a system-generated tax invoice and does not require a signature."
      : "This is a system-generated receipt and does not require a signature.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text("Generated by GymOpsFlow", pageWidth / 2, footerY + 12, { align: "center" });

  const fileNamePrefix = isGstInvoice ? "Invoice" : "Receipt";
  const fileName = `${fileNamePrefix}-${(member.name || "member").replace(/\s+/g, "_")}-${entry.startDate}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: `Payment ${isGstInvoice ? "invoice" : "receipt"} for ${member.name}`,
      });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }

  doc.save(fileName);
}

function formatGap(days) {
  if (!days || days <= 0) return null;

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const totalMonths = Math.floor(days / 30);
  const remDays = days % 30;

  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths === 1 ? "" : "s"}`);
  if (remDays > 0) parts.push(`${remDays} day${remDays === 1 ? "" : "s"}`);

  return parts.join(" ");
}

function daysBetween(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return 0;
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export default function MemberProfileModal({ member, onClose, onEdit, onExtend }) {
  const dispatch = useDispatch();
  const gym = useSelector((state) => state.owner.gym);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingCurrentDelete, setConfirmingCurrentDelete] = useState(false);
  const [sharingReceiptId, setSharingReceiptId] = useState(null);

  useEffect(() => {
    if (!member) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [member]);

  if (!member) return null;

  const initials = (member.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const activities = member.activities || [];
  const history = [...(member.membershipHistory || [])].reverse();

  const handleOpenWhatsAppChat = (mobile) => {
    const cleanPhone = String(mobile || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) return;
    const finalPhone = `91${cleanPhone}`;
    const nativeAppUrl = `whatsapp://send?phone=${finalPhone}`;
    const browserFallbackUrl = `https://api.whatsapp.com/send?phone=${finalPhone}`;
    const isMobileDevice =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.Capacitor;

    if (isMobileDevice) {
      window.location.href = nativeAppUrl;
      setTimeout(() => {
        window.location.href = browserFallbackUrl;
      }, 1500);
    } else {
      window.open(browserFallbackUrl, "MemberWhatsAppChat");
    }
  };

  const handleConfirmDelete = () => {
    dispatch(deleteMember(member.id));
    onClose();
  };

  const handleConfirmCurrentDelete = async () => {
    try {
      await dispatch(deleteCurrentMembership(member.id)).unwrap();
      onClose();
    } catch {
      setConfirmingCurrentDelete(false);
    }
  };

  const handleShareReceipt = async (entry) => {
    setSharingReceiptId(entry.id);
    try {
      await shareReceiptPdf({ gym, member, entry });
    } catch (err) {
      alert("Could not generate the receipt. Please try again.");
    } finally {
      setSharingReceiptId(null);
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-100 isolate h-dvh min-h-svh w-full overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950 [touch-action:pan-y]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 py-4">
        <button onClick={onClose} className="p-1.5 -ml-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Member Detail</h2>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-10">

        {/* DETAILS CARD */}
        <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 mb-4 border border-cyan-500/10">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-2xl shrink-0">
              {initials || <UserIcon className="h-7 w-7" />}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1 min-w-0">
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider">Name</p>
                <p className="break-words font-bold text-slate-800 dark:text-white mt-0.5">{member.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider">Mobile</p>
                <p className="break-words font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{member.mobile}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider">Age</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{member.age || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-wider">Gender</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{member.gender || "—"}</p>
              </div>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="grid grid-cols-4 gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <a href={`tel:${member.mobile}`} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Call</span>
            </a>

            <button onClick={() => handleOpenWhatsAppChat(member.mobile)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">WhatsApp</span>
            </button>

            <button onClick={() => onExtend(member)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Renew</span>
            </button>

            <button onClick={() => onEdit(member)} className="flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Edit2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Edit</span>
            </button>
          </div>
        </div>

        {/* CURRENT PLAN SUMMARY */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Current Plan</p>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {PLAN_LABELS[member.plan] || member.plan}
            </span>
          </div>

          {activities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activities.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium capitalize">
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{member.joiningDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 flex items-center gap-1"><CalendarX className="h-3 w-3" /> End Date</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{member.expiryDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500">Total Fees</p>
              <p className="font-semibold text-slate-800 dark:text-white mt-0.5">₹{member.planAmount}</p>
              {member.admissionType === "offer" && member.offerName && (
                <p className="text-[10px] font-bold text-blue-500 mt-0.5">
                  {member.offerName}
                </p>
              )}
              {member.admissionType === "normal" && Number(member.discount) > 0 && (
                <p className="text-[10px] font-bold text-emerald-500 mt-0.5">
                  ₹{member.discount} discount applied
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500">Balance</p>
              <p className={`font-bold mt-0.5 ${Number(member.balanceAmount) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                ₹{member.balanceAmount}
              </p>
            </div>
          </div>
        </div>

        {/* MEMBERSHIP HISTORY (Cleaned Card Layout) */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 mb-4">
          <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1">
            Membership History
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-500 mb-4">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {member.addedBy || "Unknown"}
            </span>{" "}
            originally added this member.
          </p>

          {history.length === 0 ? (
            <p className="text-center text-xs text-slate-600 dark:text-slate-500 py-6">
              No membership history recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry, idx) => {
                const olderEntry = history[idx + 1];
                const gapDays = olderEntry
                  ? daysBetween(olderEntry.endDate, entry.startDate)
                  : 0;
                const gapLabel = gapDays > 1 ? formatGap(gapDays) : null;

                return (
                  <React.Fragment key={entry.id}>
                    <div
                      className={`border rounded-xl p-4 bg-white dark:bg-slate-900/40 space-y-3 ${
                        entry.admissionType === "offer"
                          ? "border-blue-500/40"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* Row 1: Badges & Amount */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Current
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              entry.type === "joined"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : entry.type === "renewed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {entry.type === "joined" ? (
                              <UserPlus className="h-3 w-3" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            {entry.type === "joined"
                              ? "Joined"
                              : entry.type === "renewed"
                              ? "Renewed"
                              : "Extended"}
                          </span>

                          {entry.admissionType === "offer" && (
                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              {entry.offerName || "Offer"}
                            </span>
                          )}

                          {entry.admissionType === "normal" && Number(entry.discount) > 0 && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                              ₹{entry.discount} off
                            </span>
                          )}
                        </div>

                        <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0">
                          ₹{Number(entry.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Row 2: Plan Name & Date Duration */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {PLAN_LABELS[entry.plan] || entry.plan} Membership
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {entry.startDate} <span className="text-slate-400">→</span> {entry.endDate}
                        </span>
                      </div>

                      {/* Row 3: Activities (Only if present) */}
                      {entry.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {entry.activities.map((activity) => (
                            <span
                              key={activity}
                              className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-medium capitalize"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Row 4: Added By Info & Receipt Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0 truncate">
                          <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            Added by <strong className="font-semibold text-slate-700 dark:text-slate-300">{entry.by}</strong> on {entry.date}
                          </span>
                        </p>

                        <button
                          onClick={() => handleShareReceipt(entry)}
                          disabled={sharingReceiptId === entry.id}
                          className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-60 shrink-0 cursor-pointer transition-colors ml-2"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {sharingReceiptId === entry.id ? "Preparing..." : "Receipt"}
                        </button>
                      </div>
                    </div>

                    {/* Gap Indicator */}
                    {gapLabel && (
                      <div className="flex items-center gap-2 pl-3 my-2">
                        <div className="w-0.5 h-4 bg-amber-500/30 ml-2" />
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                          <Hourglass className="h-2.5 w-2.5" />
                          {gapLabel} gap before renewing
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* DELETE ACTIONS */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
          {confirmingCurrentDelete ? (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
              <p className="text-xs text-amber-300 mb-3">
                Delete only the current membership? Older membership history and this member will remain.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmCurrentDelete}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
                >
                  Delete Current
                </button>
                <button
                  onClick={() => setConfirmingCurrentDelete(false)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingCurrentDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Current Membership
            </button>
          )}

          {confirmingDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> Confirm Delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm font-bold uppercase tracking-wider py-2.5 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete Member
            </button>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}