import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Lock,
  Sparkles,
  CalendarClock,
  UserPlus,
  Wallet,
  Link2,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import PlanSelectionModal from "./PlanSelectionModal";
import { testSendWhatsappAutomationApi } from "../../api/ownerApi";
import {
  connectWhatsapp,
  disconnectWhatsapp,
  updateWhatsappAutomationSettings,
  clearWhatsappActionError,
} from "../../redux/slices/ownerSlice";

function ToggleRow({ icon: Icon, iconColor, title, description, checked, onChange, disabled, children }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-opacity ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`shrink-0 rounded-lg p-2 ${iconColor}`}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-700 dark:text-slate-100 text-sm">{title}</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`shrink-0 relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed ${
            checked ? "bg-lime-400" : "bg-slate-100 dark:bg-slate-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {checked && children && (
        <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3">{children}</div>
      )}
    </div>
  );
}

function LockedUpsell({ onUpgrade }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lime-400/10">
        <Lock className="h-6 w-6 text-lime-400" />
      </div>
      <h2 className="text-base font-bold text-slate-700 dark:text-slate-100 mb-2">
        WhatsApp Automation is a Plus feature
      </h2>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 mb-6">
        Automatically send expiry reminders, welcome messages, invoices, and
        offer broadcasts — no more manual{" "}
        <span className="text-slate-600 dark:text-slate-300 font-medium">wa.me</span> links.
        Upgrade to Plus to turn this on.
      </p>
      <button
        onClick={onUpgrade}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-bold text-slate-900 shadow hover:bg-lime-300 transition-colors"
      >
        <Sparkles size={16} />
        Upgrade to Plus
      </button>
    </div>
  );
}

// Small "template name" input + "Send Test" mini-form, dropped into
// any automation's ToggleRow. Sends ONE real message via the app
// itself (backend fills realistic sample values) so the owner can
// confirm a freshly-approved Meta template actually delivers,
// without waiting for a real member to hit the trigger.
function TemplateTestField({ automation, templateName, onTemplateNameChange }) {
  const [testPhone, setTestPhone] = useState("");
  const [status, setStatus] = useState(null); // { loading, success, message }

  const handleTestSend = async () => {
    setStatus({ loading: true, success: null, message: "" });
    try {
      const response = await testSendWhatsappAutomationApi(automation, testPhone);
      setStatus({ loading: false, success: true, message: response.data.message });
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        message: err?.response?.data?.message || "Could not send test message.",
      });
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Approved Meta template name
        <input
          type="text"
          placeholder="e.g. gym_membership_expiry_reminder"
          value={templateName || ""}
          onChange={(e) => onTemplateNameChange(e.target.value.trim())}
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-lime-400"
        />
      </label>

      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="10-digit test number"
          value={testPhone}
          maxLength={10}
          onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ""))}
          className="w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-lime-400"
        />
        <button
          type="button"
          disabled={!templateName || testPhone.length !== 10 || status?.loading}
          onClick={handleTestSend}
          className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status?.loading ? "Sending..." : "Send Test"}
        </button>
      </div>

      {status && !status.loading && (
        <p className={`text-xs font-medium ${status.success ? "text-emerald-400" : "text-rose-400"}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}

export default function ManageWhatsApp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const gym = useSelector((state) => state.owner.gym);
  const subscriptionPlan = useSelector(
    (state) => state.owner.currentSubscription?.subscriptionPlan
  );
  const whatsappActionLoading = useSelector(
    (state) => state.owner.whatsappActionLoading
  );
  const whatsappActionError = useSelector(
    (state) => state.owner.whatsappActionError
  );

  const isLocked = subscriptionPlan === "Basic" || !subscriptionPlan;
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [connectForm, setConnectForm] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
  });

  const integration = gym?.whatsappIntegration || { connected: false };
  const settings =
    gym?.whatsappAutomationSettings || {
      enabled: false,
      expiryReminder: { enabled: false, daysBefore: 3 },
      memberWelcome: { enabled: false },
      extendRenewal: { enabled: false },
      balanceConfirmation: { enabled: false },
    };

  // Manual setup: the gym owner (with our help) creates their OWN
  // WhatsApp Business Account in Meta Business Suite, then copies
  // these 3 values from WhatsApp Manager → API Setup. No Meta "Tech
  // Provider" approval needed for this path — each business generates
  // its own permanent token. (Embedded Signup, which automates this
  // inside the app, needs that approval — revisit once we have
  // enough gyms to justify it.)
  const handleConnectSubmit = (e) => {
    e.preventDefault();
    if (!connectForm.phoneNumberId || !connectForm.wabaId || !connectForm.accessToken) {
      return;
    }
    dispatch(connectWhatsapp(connectForm)).then((result) => {
      if (!result.error) {
        setShowConnectForm(false);
        setConnectForm({ phoneNumberId: "", wabaId: "", accessToken: "" });
      }
    });
  };

  const handleDisconnect = () => {
    if (window.confirm("Disconnect this WhatsApp Business Account? Automation will pause until reconnected.")) {
      dispatch(disconnectWhatsapp());
    }
  };

  const handleMasterToggle = (enabled) => {
    dispatch(updateWhatsappAutomationSettings({ enabled }));
  };

  const handleExpiryReminderChange = (patch) => {
    dispatch(
      updateWhatsappAutomationSettings({
        expiryReminder: { ...settings.expiryReminder, ...patch },
      })
    );
  };

  const handleMemberWelcomeChange = (patch) => {
    dispatch(
      updateWhatsappAutomationSettings({
        memberWelcome: { ...settings.memberWelcome, ...patch },
      })
    );
  };

  const handleExtendRenewalChange = (patch) => {
    dispatch(
      updateWhatsappAutomationSettings({
        extendRenewal: { ...settings.extendRenewal, ...patch },
      })
    );
  };

  const handleBalanceConfirmationChange = (patch) => {
    dispatch(
      updateWhatsappAutomationSettings({
        balanceConfirmation: { ...settings.balanceConfirmation, ...patch },
      })
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
          <MessageCircle size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-700 dark:text-slate-100">Manage WhatsApp</h1>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Automate reminders, welcomes, invoices &amp; offers
          </p>
        </div>
      </div>

      {whatsappActionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-xs text-rose-300">
          <span>{whatsappActionError}</span>
          <button
            onClick={() => dispatch(clearWhatsappActionError())}
            className="shrink-0 font-bold hover:text-rose-100"
          >
            ✕
          </button>
        </div>
      )}

      {isLocked ? (
        <LockedUpsell onUpgrade={() => setShowPlanModal(true)} />
      ) : (
        <div className="space-y-4">
          {/* ===== Connect account ===== */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <Link2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-100 text-sm">
                    Your WhatsApp Business Account
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
                    Your own number — you manage templates &amp; billing with Meta directly.
                  </p>
                </div>
              </div>

              {integration.connected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={whatsappActionLoading}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-60"
                >
                  {whatsappActionLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Connected
                </button>
              ) : (
                <button
                  onClick={() => setShowConnectForm((v) => !v)}
                  className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20"
                >
                  Connect
                </button>
              )}
            </div>

            {!integration.connected && showConnectForm && (
              <form onSubmit={handleConnectSubmit} className="mt-4 space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-5">
                  Contact us to set up your own WhatsApp Business Account in
                  Meta Business Suite, then paste the 3 values from{" "}
                  <span className="text-slate-600 dark:text-slate-300">WhatsApp Manager → API Setup</span> below.
                </p>

                <input
                  type="text"
                  placeholder="Phone Number ID"
                  value={connectForm.phoneNumberId}
                  onChange={(e) => setConnectForm((s) => ({ ...s, phoneNumberId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400"
                />
                <input
                  type="text"
                  placeholder="WABA ID"
                  value={connectForm.wabaId}
                  onChange={(e) => setConnectForm((s) => ({ ...s, wabaId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400"
                />
                <input
                  type="password"
                  placeholder="Permanent Access Token"
                  value={connectForm.accessToken}
                  onChange={(e) => setConnectForm((s) => ({ ...s, accessToken: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400"
                />

                <button
                  type="submit"
                  disabled={whatsappActionLoading}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-3 py-2 text-xs font-bold text-slate-950"
                >
                  {whatsappActionLoading ? "Connecting..." : "Save & Connect"}
                </button>
              </form>
            )}
          </div>

          {/* ===== Master switch ===== */}
          <ToggleRow
            icon={Sparkles}
            iconColor="bg-lime-400/10 text-lime-400"
            title="Enable WhatsApp Automation"
            description={
              settings.enabled
                ? "Automation is live — the manual wa.me button is hidden across the app."
                : "Off for now — you'll keep using the manual wa.me button, same as Basic."
            }
            checked={settings.enabled}
            onChange={handleMasterToggle}
            disabled={!integration.connected || whatsappActionLoading}
          />
          {!integration.connected && (
            <p className="-mt-2 px-1 text-xs text-amber-400">
              Connect your WhatsApp Business Account above before turning automation on.
            </p>
          )}

          {/* ===== Per-automation settings ===== */}
          <div className={settings.enabled ? "" : "pointer-events-none opacity-50"}>
            <h2 className="mb-2.5 mt-5 text-xs font-bold uppercase text-slate-600 dark:text-slate-500">
              Automations
            </h2>

            <div className="space-y-3">
              <ToggleRow
                icon={CalendarClock}
                iconColor="bg-rose-500/10 text-rose-400"
                title="Expiry Reminder"
                description="Send a reminder before a member's plan expires."
                checked={settings.expiryReminder.enabled}
                onChange={(v) => handleExpiryReminderChange({ enabled: v })}
                disabled={!settings.enabled}
              >
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  Send
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={settings.expiryReminder.daysBefore}
                    onChange={(e) =>
                      handleExpiryReminderChange({ daysBefore: Number(e.target.value) })
                    }
                    className="w-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-center text-slate-700 dark:text-slate-100 outline-none focus:border-lime-400"
                  />
                  day(s) before expiry
                </label>

                <TemplateTestField
                  automation="expiryReminder"
                  templateName={settings.expiryReminder.templateName}
                  onTemplateNameChange={(templateName) =>
                    handleExpiryReminderChange({ templateName })
                  }
                />
              </ToggleRow>

              <ToggleRow
                icon={UserPlus}
                iconColor="bg-cyan-500/10 text-cyan-400"
                title="Welcome on Member Create"
                description="Send a welcome message the moment a new member is added."
                checked={settings.memberWelcome.enabled}
                onChange={(v) => handleMemberWelcomeChange({ enabled: v })}
                disabled={!settings.enabled}
              >
                <TemplateTestField
                  automation="memberWelcome"
                  templateName={settings.memberWelcome.templateName}
                  onTemplateNameChange={(templateName) =>
                    handleMemberWelcomeChange({ templateName })
                  }
                />
              </ToggleRow>

              <ToggleRow
                icon={RefreshCw}
                iconColor="bg-indigo-500/10 text-indigo-400"
                title="Extend / Renew Confirmation"
                description="Confirm automatically when a membership is extended or renewed."
                checked={settings.extendRenewal.enabled}
                onChange={(v) => handleExtendRenewalChange({ enabled: v })}
                disabled={!settings.enabled}
              >
                <TemplateTestField
                  automation="extendRenewal"
                  templateName={settings.extendRenewal.templateName}
                  onTemplateNameChange={(templateName) =>
                    handleExtendRenewalChange({ templateName })
                  }
                />
              </ToggleRow>

              <ToggleRow
                icon={Wallet}
                iconColor="bg-violet-500/10 text-violet-400"
                title="Balance Cleared Confirmation"
                description="Confirm automatically once a member's pending balance is paid off."
                checked={settings.balanceConfirmation.enabled}
                onChange={(v) => handleBalanceConfirmationChange({ enabled: v })}
                disabled={!settings.enabled}
              >
                <TemplateTestField
                  automation="balanceConfirmation"
                  templateName={settings.balanceConfirmation.templateName}
                  onTemplateNameChange={(templateName) =>
                    handleBalanceConfirmationChange({ templateName })
                  }
                />
              </ToggleRow>
            </div>
          </div>

          {/* ===== Offers (links to a separate future page) ===== */}
          <button
            disabled={!settings.enabled}
            onClick={() => navigate("/owner/whatsapp/offers")}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-left transition disabled:opacity-50 hover:border-lime-400/40"
          >
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Offer Broadcasts</p>
              <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
                Create a template, pick a date &amp; audience, and publish an offer.
              </p>
            </div>
            <ArrowLeft className="rotate-180 text-slate-600" size={16} />
          </button>
        </div>
      )}

      {showPlanModal && (
        <PlanSelectionModal
          onClose={() => setShowPlanModal(false)}
          gymName={gym?.gymName}
        />
      )}
    </div>
  );
}