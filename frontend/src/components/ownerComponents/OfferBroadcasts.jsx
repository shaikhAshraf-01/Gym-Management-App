import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Lock, Sparkles, Users, X, Loader2 } from "lucide-react";
import PlanSelectionModal from "./PlanSelectionModal";
import {
  fetchOffers,
  createOffer,
  cancelOffer,
  fetchAudienceCount,
  clearOfferActionError,
} from "../../redux/slices/offersSlice";

const AUDIENCE_OPTIONS = [
  { value: "all_members", label: "All Members" },
  { value: "active_members", label: "Active Members" },
  { value: "inactive_members", label: "Inactive Members" },
  { value: "all_members_and_enquiries", label: "All Members + Enquiries" },
];

const STATUS_STYLES = {
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  cancelled: "bg-slate-700/30 text-slate-400 border-slate-700",
};

// Scheduling for "today" risks landing after that day's cron already
// ran (it fires once, at a fixed time) — so the earliest pickable
// date is tomorrow, which keeps "when will this actually send" simple
// to explain: the next day's run, guaranteed.
function tomorrowDateInputValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function OfferBroadcasts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const subscriptionPlan = useSelector(
    (state) => state.owner.currentSubscription?.subscriptionPlan
  );
  const isLocked = subscriptionPlan === "Basic" || !subscriptionPlan;
  const gymName = useSelector((state) => state.owner.gym?.gymName);

  const offers = useSelector((state) => state.offers.offers);
  const loading = useSelector((state) => state.offers.loading);
  const actionLoading = useSelector((state) => state.offers.actionLoading);
  const actionError = useSelector((state) => state.offers.actionError);
  const audienceCount = useSelector((state) => state.offers.audienceCount);
  const audienceCountLoading = useSelector((state) => state.offers.audienceCountLoading);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(tomorrowDateInputValue());
  const [audience, setAudience] = useState("all_members");

  useEffect(() => {
    if (!isLocked) dispatch(fetchOffers());
  }, [dispatch, isLocked]);

  useEffect(() => {
    if (!isLocked) dispatch(fetchAudienceCount(audience));
  }, [dispatch, audience, isLocked]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateName.trim() || !scheduledDate) return;
    dispatch(createOffer({ templateName: templateName.trim(), scheduledDate, audience })).then(
      (result) => {
        if (!result.error) {
          setTemplateName("");
          setScheduledDate(tomorrowDateInputValue());
        }
      }
    );
  };

  if (isLocked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lime-400/10">
            <Lock className="h-6 w-6 text-lime-400" />
          </div>
          <h2 className="text-base font-bold text-slate-100 mb-2">
            Offer Broadcasts is a Plus feature
          </h2>
          <p className="text-sm leading-6 text-slate-400 mb-6">
            Schedule a WhatsApp offer to your members or enquiries in one go.
            Upgrade to Plus to unlock it.
          </p>
          <button
            onClick={() => setShowPlanModal(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-bold text-slate-900 shadow hover:bg-lime-300 transition-colors"
          >
            <Sparkles size={16} />
            Upgrade to Plus
          </button>
        </div>

        {showPlanModal && (
          <PlanSelectionModal onClose={() => setShowPlanModal(false)} gymName={gymName} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
          <Megaphone size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Offer Broadcasts</h1>
          <p className="text-xs text-slate-500">Schedule a WhatsApp offer to your audience</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-xs text-rose-300">
          <span>{actionError}</span>
          <button
            onClick={() => dispatch(clearOfferActionError())}
            className="shrink-0 font-bold hover:text-rose-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== Schedule form ===== */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
      >
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
            Template Name
          </label>
          <input
            type="text"
            placeholder="e.g. diwali_offer_2026"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            The exact name of a Meta-approved template on your connected account.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Send Date
            </label>
            <input
              type="date"
              min={tomorrowDateInputValue()}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users size={13} />
          {audienceCountLoading ? (
            <span>Counting recipients...</span>
          ) : (
            <span>
              Reaches ~<span className="font-bold text-slate-200">{audienceCount ?? "-"}</span>{" "}
              {audienceCount === 1 ? "person" : "people"}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={actionLoading || !templateName.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 px-4 py-3 text-sm font-bold text-slate-950"
        >
          {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
          {actionLoading ? "Scheduling..." : "Schedule Offer"}
        </button>
      </form>

      {/* ===== Past / upcoming offers ===== */}
      <h2 className="mb-2.5 text-xs font-bold uppercase text-slate-500">Offers</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-slate-500">No offers scheduled yet.</p>
      ) : (
        <div className="space-y-2.5">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {offer.templateName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(offer.scheduledDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  ·{" "}
                  {AUDIENCE_OPTIONS.find((a) => a.value === offer.audience)?.label ||
                    offer.audience}
                  {offer.status === "sent" && (
                    <> · {offer.sentCount} sent{offer.failedCount > 0 ? `, ${offer.failedCount} failed` : ""}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${STATUS_STYLES[offer.status]}`}
                >
                  {offer.status}
                </span>
                {offer.status === "scheduled" && (
                  <button
                    onClick={() => dispatch(cancelOffer(offer._id))}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-slate-700"
                    title="Cancel offer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}