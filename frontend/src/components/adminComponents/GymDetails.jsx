import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Users,
  UserPlus,
  Inbox,
  Wallet,
  IndianRupee,
  Search,
  Edit3,
  RefreshCw,
  UserCog,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";
import { fetchGyms, deleteGym } from "../../redux/slices/gymSlice";
import {
  getGymOverviewApi,
  getGymMembersApi,
  getGymEnquiriesApi,
  getGymSalesApi,
} from "../../api/adminApi";
import { useBackHandler } from "../../hooks/useBackHandler";
import EditGymModal from "./EditGymModal";
import RenewGymModal from "./RenewGymModal";
import ManageTrainersModal from "./ManageTrainersModal";
import { GymTimelineContent } from "./GymTimelineModal";

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "enquiries", label: "Enquiries" },
  { id: "trainers", label: "Trainers" },
  { id: "sales", label: "Sales" },
  { id: "timeline", label: "Timeline" },
];

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const timeAgo = (v) => {
  if (!v) return "—";
  const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

const daysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

const cleanPhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);

// Loads data from an API function and reloads when `deps` change.
function useApiData(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));

    (async () => {
      try {
        const res = await fn();
        if (!cancelled) {
          setState({ data: res?.data?.data ?? null, loading: false, error: "" });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err?.response?.data?.message || "Something went wrong.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StatCard({ icon: Icon, label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 border-slate-100 text-slate-500",
    indigo: "bg-indigo-50/60 border-indigo-100 text-indigo-600",
    emerald: "bg-emerald-50/60 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50/60 border-amber-100 text-amber-600",
    rose: "bg-rose-50/60 border-rose-100 text-rose-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Loading({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-400">
      <RefreshCw className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Empty({ text }) {
  return <div className="py-12 text-center text-sm text-slate-400">{text}</div>;
}

function Pager({ page, pages, total, onChange }) {
  if (pages <= 1) return <p className="text-xs text-slate-400 pt-3">{total} total</p>;
  return (
    <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Overview
// ------------------------------------------------------------------
function OverviewTab({ gym, overview }) {
  const { data, loading, error } = overview;
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const { members, enquiries, sales } = data;
  const current = gym.currentSubscription;
  const left = current ? daysUntil(current.endDate) : null;

  const growth =
    sales.lastMonth > 0
      ? Math.round(((sales.thisMonth - sales.lastMonth) / sales.lastMonth) * 100)
      : null;

  const lastActivity = [members.lastAddedAt, enquiries.lastAt, sales.lastSaleDate]
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .sort((a, b) => b - a)[0];

  const inactive = lastActivity
    ? (Date.now() - lastActivity) / 86400000 >= 7
    : true;

  return (
    <div className="space-y-5">
      {inactive && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Activity className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {lastActivity
              ? `No activity in this gym for ${Math.floor(
                  (Date.now() - lastActivity) / 86400000
                )} days (last: ${fmtDate(lastActivity)}).`
              : "This gym hasn't recorded any member, enquiry or sale yet."}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Members"
          value={members.total}
          sub={`${members.active} active · ${members.expired} expired`}
          tone="indigo"
        />
        <StatCard
          icon={Inbox}
          label="Enquiries"
          value={enquiries.total}
          sub={enquiries.lastAt ? `Last: ${timeAgo(enquiries.lastAt)}` : "None yet"}
          tone="amber"
        />
        <StatCard
          icon={Wallet}
          label="Sales this month"
          value={inr(sales.thisMonth)}
          sub={
            growth === null
              ? `Last month ${inr(sales.lastMonth)}`
              : `${growth >= 0 ? "+" : ""}${growth}% vs last month`
          }
          tone="emerald"
        />
        <StatCard
          icon={UserPlus}
          label="Last member added"
          value={timeAgo(members.lastAddedAt)}
          sub={fmtDate(members.lastAddedAt)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={UserCog} label="Trainers" value={gym.trainers?.length || 0} />
        <StatCard icon={IndianRupee} label="Lifetime sales" value={inr(sales.lifetime)} />
        <StatCard
          icon={AlertCircle}
          label="Pending balance"
          value={inr(members.pendingBalance)}
          sub="From members' latest plans"
          tone={members.pendingBalance > 0 ? "rose" : "slate"}
        />
        <StatCard
          icon={Users}
          label="Removed members"
          value={members.deleted}
          sub="Soft-deleted by owner"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subscription with us
          </p>
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="font-semibold text-slate-800">{current?.subscriptionPlan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Period</span>
            <span className="font-semibold text-slate-800">
              {current?.startDate} → {current?.endDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Time left</span>
            <span
              className={`font-semibold ${
                left < 0 ? "text-rose-600" : left <= 7 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {left < 0 ? `Expired ${Math.abs(left)}d ago` : `${left} days`}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gym details
          </p>
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <span>{gym.address || "No address added"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{gym.owner?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="truncate">{gym.owner?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Members
// ------------------------------------------------------------------
const MEMBER_STATUS_STYLE = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
  none: "bg-slate-100 text-slate-500 border-slate-200",
};

function MembersTab({ gymId }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q, status]);

  const { data, loading, error } = useApiData(
    () => getGymMembersApi(gymId, { search: q, status, page, limit: 20 }),
    [gymId, q, status, page]
  );

  const counts = data?.counts || { all: 0, active: 0, expired: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search member name or mobile..." />
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
          {["all", "active", "expired"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                status === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : loading && !data ? (
        <Loading />
      ) : data?.members.length === 0 ? (
        <Empty text="No members found." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{m.name}</div>
                      <a
                        href={`tel:${m.mobile}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {m.mobile}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {m.plan || "—"}
                      {m.admissionType === "offer" && (
                        <span className="ml-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                          Offer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {m.startDate ? `${m.startDate} → ${m.endDate}` : "—"}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${m.balance > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {m.balance > 0 ? inr(m.balance) : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(m.addedAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${MEMBER_STATUS_STYLE[m.status]}`}
                      >
                        {m.status === "none" ? "No plan" : m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Enquiries
// ------------------------------------------------------------------
function EnquiriesTab({ gymId }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q]);

  const { data, loading, error } = useApiData(
    () => getGymEnquiriesApi(gymId, { search: q, page, limit: 20 }),
    [gymId, q, page]
  );

  return (
    <div className="space-y-4">
      <SearchBox value={search} onChange={setSearch} placeholder="Search enquiry name or mobile..." />

      {error ? (
        <ErrorBox message={error} />
      ) : loading && !data ? (
        <Loading />
      ) : data?.enquiries.length === 0 ? (
        <Empty text="No enquiries found." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Willing to join</th>
                  <th className="py-3 px-4">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{e.name}</td>
                    <td className="py-3 px-4">
                      <a
                        href={`tel:${e.mobile}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {e.mobile}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{e.willingToJoin || "—"}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {fmtDate(e.createdAt)} · {timeAgo(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Trainers (read-only list; edits go through the Manage Trainers modal)
// ------------------------------------------------------------------
function TrainersTab({ gym, onManage }) {
  const trainers = gym.trainers || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {trainers.length} trainer{trainers.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
        >
          <UserCog className="h-4 w-4" />
          Manage Trainers
        </button>
      </div>

      {trainers.length === 0 ? (
        <Empty text="No trainers added yet." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {trainers.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 p-4 space-y-1.5">
              <p className="font-bold text-slate-800">{t.name}</p>
              <a
                href={`tel:${t.mobile}`}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
              >
                <Phone className="h-3.5 w-3.5" />
                {t.mobile}
              </a>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{t.email}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Sales
// ------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const SALES_PRESETS = [
  { id: "month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "3-months", label: "Last 3 months" },
  { id: "fy", label: "This financial year" },
  { id: "all", label: "All time" },
];

function presetRange(id) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (id === "month") return { from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
  if (id === "last-month") return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
  if (id === "3-months") return { from: ymd(new Date(y, m - 2, 1)), to: ymd(new Date(y, m + 1, 0)) };
  if (id === "fy") {
    const fy = m < 3 ? y - 1 : y;
    return { from: `${fy}-04-01`, to: `${fy + 1}-03-31` };
  }
  return {};
}

const MODE_LABEL = { upi: "UPI", cash: "Cash" };
const MODE_COLOR = { upi: "bg-sky-400", cash: "bg-emerald-400" };
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};

function BarList({ rows, labelFn = (k) => k }) {
  const max = Math.max(...rows.map((r) => r.amount), 1);
  if (rows.length === 0) return <p className="text-xs text-slate-400">No data.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 capitalize">{labelFn(r.key)}</span>
            <span className="font-semibold text-slate-800">
              {inr(r.amount)} <span className="font-normal text-slate-400">· {r.count}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400"
              style={{ width: `${(r.amount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesTab({ gymId }) {
  const [preset, setPreset] = useState("month");
  const range = presetRange(preset);

  const { data, loading, error } = useApiData(
    () => getGymSalesApi(gymId, range),
    [gymId, preset]
  );

  const modeRow = (key) => data?.byMode.find((r) => r.key === key) || { amount: 0, count: 0 };
  const maxMonthly = Math.max(...(data?.monthly || []).map((r) => r.amount), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        {SALES_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              preset === p.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : loading && !data ? (
        <Loading />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Wallet} label="Total collected" value={inr(data.total)} tone="emerald" />
            <StatCard icon={Users} label="Entries" value={data.count} sub="Joins, renewals & extensions" />
            {["upi", "cash"].map((k) => (
              <StatCard
                key={k}
                icon={IndianRupee}
                label={MODE_LABEL[k]}
                value={inr(modeRow(k).amount)}
                sub={`${modeRow(k).count} payment${modeRow(k).count === 1 ? "" : "s"}`}
              />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Last 6 months
              </p>
              <div className="flex items-end gap-2 h-36">
                {data.monthly.map((r) => (
                  <div key={r.month} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                    <span className="text-[9px] text-slate-500 truncate">
                      {r.amount ? inr(r.amount) : ""}
                    </span>
                    <div className="w-full flex items-end justify-center" style={{ height: "96px" }}>
                      <div
                        className="w-full max-w-9 rounded-t-md bg-indigo-400"
                        style={{ height: `${Math.max((r.amount / maxMonthly) * 100, r.amount ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">{monthLabel(r.month)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  By plan
                </p>
                <BarList rows={data.byPlan} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Normal vs Offer admissions
                </p>
                <BarList rows={data.byAdmissionType} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Recent entries {data.recent.length === 50 ? "(latest 50)" : ""}
            </p>
            {data.recent.length === 0 ? (
              <Empty text="No sales in this period." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-xs text-slate-500">{fmtDate(r.date)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.memberName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.plan}
                          {r.admissionType === "offer" && (
                            <span className="ml-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                              {r.offerName || "Offer"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${MODE_COLOR[r.paymentMode] || "bg-slate-300"}`} />
                            {MODE_LABEL[r.paymentMode] || r.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{inr(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function GymDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { gyms = [], loading } = useSelector((state) => state.gyms || state.gym);
  const gym = gyms.find((g) => g._id === id);

  // Direct link / refresh: the list may not be in Redux yet.
  useEffect(() => {
    if (gyms.length === 0) dispatch(fetchGyms());
  }, [dispatch, gyms.length]);

  const tab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  const [modal, setModal] = useState(null); // "edit" | "renew" | "trainers"
  const [confirmDelete, setConfirmDelete] = useState(false);
  useBackHandler(confirmDelete, () => setConfirmDelete(false));

  const overview = useApiData(() => getGymOverviewApi(id), [id]);

  if (!gym) {
    return loading || gyms.length === 0 ? (
      <Loading text="Loading gym..." />
    ) : (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/admin/all-gyms")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          All gyms
        </button>
        <Empty text="This gym doesn't exist (it may have been deleted)." />
      </div>
    );
  }

  const current = gym.currentSubscription;
  const left = current ? daysUntil(current.endDate) : null;
  const phone = cleanPhone(gym.owner?.mobile);

  const doDelete = () => {
    dispatch(deleteGym(gym._id));
    setConfirmDelete(false);
    setModal(null);
    navigate("/admin/all-gyms");
  };

  const headBtn =
    "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors";

  return (
    <div className="space-y-5 pb-16">
      <button
        type="button"
        onClick={() => navigate("/admin/all-gyms")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        All gyms
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{gym.gymName}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                  gym.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {gym.status === "active" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                {gym.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">{gym.gymCode}</p>
            <p className="text-xs text-slate-500 mt-1.5">
              {current?.subscriptionPlan} plan ·{" "}
              {left < 0 ? (
                <span className="text-rose-600 font-semibold">expired {Math.abs(left)}d ago</span>
              ) : (
                <span className="font-semibold">{left} days left</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {phone.length === 10 && (
              <>
                <a
                  href={`tel:${phone}`}
                  className={`${headBtn} bg-slate-100 hover:bg-slate-200 text-slate-700`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call owner
                </a>
                <a
                  href={`https://wa.me/91${phone}`}
                  target="FitZoneWhatsAppTab"
                  rel="noreferrer"
                  className={`${headBtn} bg-green-50 hover:bg-green-100 text-green-700`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setModal("edit")}
              className={`${headBtn} bg-indigo-50 hover:bg-indigo-100 text-indigo-700`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setModal("renew")}
              className={`${headBtn} bg-emerald-50 hover:bg-emerald-100 text-emerald-700`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Renew
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 -mb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        {tab === "overview" && <OverviewTab gym={gym} overview={overview} />}
        {tab === "members" && <MembersTab gymId={id} />}
        {tab === "enquiries" && <EnquiriesTab gymId={id} />}
        {tab === "trainers" && <TrainersTab gym={gym} onManage={() => setModal("trainers")} />}
        {tab === "sales" && <SalesTab gymId={id} />}
        {tab === "timeline" && <GymTimelineContent gym={gym} />}
      </div>

      {/* MODALS */}
      {modal === "edit" && (
        <EditGymModal
          key={gym._id}
          gym={gym}
          onClose={() => setModal(null)}
          onRequestDelete={() => setConfirmDelete(true)}
        />
      )}
      {modal === "renew" && (
        <RenewGymModal key={gym._id} gym={gym} onClose={() => setModal(null)} />
      )}
      {modal === "trainers" && (
        <ManageTrainersModal key={gym._id} gym={gym} onClose={() => setModal(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-bold text-slate-800">Delete this gym?</h3>
            </div>
            <p className="text-sm text-slate-500">
              This will permanently remove "{gym.gymName}" and all its data, including
              trainer accounts. This can't be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Delete Gym
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}