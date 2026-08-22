import { useState } from "react";
import {
  Dumbbell,
  Users,
  MessageCircle,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import LoginForm from "./LoginForm";
import { useBackHandler } from "../hooks/useBackHandler";

const features = [
  {
    icon: Users,
    title: "Member Management",
    description:
      "Add, edit, and track every member's plan, payments, and renewal dates in one place.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Reminders",
    description:
      "Send renewal confirmations and balance-due reminders straight to a member's WhatsApp.",
  },
  {
    icon: BarChart3,
    title: "Sales & Insights",
    description:
      "See revenue, active members, and enquiries at a glance from your owner dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description:
      "Separate, secure logins for admins, gym owners, and trainers — everyone sees only what they need.",
  },
];

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hardware back button (Android) should close the login modal, not
  // exit the app or navigate away — same pattern as every other modal
  // in this app.
  useBackHandler(showLogin, () => setShowLogin(false));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              GymOpsFlow
            </span>
          </div>

          {/* Right-side Login button (desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-sm font-semibold transition-colors shadow-sm"
            >
              Login
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 text-slate-300"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/10 px-4 py-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogin(true);
              }}
              className="w-full px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-sm font-semibold"
            >
              Login
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-6">
            Built for gyms, by people who run gyms
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Run your gym's day-to-day,
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              without the spreadsheet chaos
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
            GymOpsFlow keeps members, renewals, payments, and WhatsApp
            reminders organized — so you spend less time on paperwork and
            more time on the gym floor.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="px-7 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 font-semibold shadow-lg shadow-indigo-900/40 transition-colors"
            >
              Login to your account
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/40 transition-colors"
            >
              <div className="h-11 w-11 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-indigo-300" />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} GymOpsFlow. All rights reserved.
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogin(false);
          }}
        >
          <div className="w-full max-w-md mx-auto my-8 rounded-2xl bg-white/10 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.3)] p-6 sm:p-10 relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <LoginForm onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  );
}