import { useState } from "react";
import {
  Dumbbell,
  Users,
  MessageCircle,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import LoginForm from "./LoginForm";
import { useBackHandler } from "../hooks/useBackHandler";

const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Add, edit, and track every member's active plan, payment history, and upcoming renewal dates in one unified screen.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Reminders",
    description: "Send instant automated renewal confirmations and pending balance-due alerts straight to your member's WhatsApp.",
  },
  {
    icon: BarChart3,
    title: "Sales & Insights",
    description: "Monitor monthly gross revenue, total active headcounts, and incoming cold enquiries directly from the owner dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description: "Secure standalone login portals for admins, gym owners, and desk trainers — ensuring everyone sees exactly what they need.",
  },
];

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useBackHandler(showLogin, () => setShowLogin(false));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white scroll-smooth">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              GymOps<span className="text-indigo-400">Flow</span>
            </span>
          </div>

          {/* Desktop Navigation Link Blocks */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-indigo-900/30 text-white"
            >
              Login
            </button>
          </div>

          <button className="sm:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/5 bg-slate-950 px-4 py-4 space-y-3">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-400 font-medium">Home</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-400 font-medium">Features</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-400 font-medium">About Us</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-400 font-medium">Contact Us</a>
            <button
              onClick={() => { setMobileMenuOpen(false); setShowLogin(true); }}
              className="w-full text-center mt-2 px-5 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg"
            >
              Login
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-24 pb-20 overflow-hidden scroll-mt-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_50%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-8 backdrop-blur-md">
            Built for gyms, by people who run gyms
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-white">
            Run your gym's day-to-day,<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
              without the spreadsheet chaos
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            GymOpsFlow keeps your active members, system renewals, ongoing bill payments, and operational WhatsApp reminders organized — so you spend zero time on messy paper logs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 hover:opacity-90 font-bold transition-all shadow-lg shadow-indigo-900/30 transform hover:-translate-y-0.5 text-white flex items-center justify-center gap-2"
            >
              Login to your account <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
      {/* FEATURES SECTION */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Platform Features</h2>
          <p className="mt-4 text-slate-400">Everything essential you need to track cashflow operations and scale your gym community seamlessly.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-600 transition-colors">
                <Icon className="h-5 w-5 text-indigo-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{title}</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/5 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Who We Are</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mt-3">Simplifying Gym Operations Ecosystems</h2>
            <p className="mt-5 text-slate-400 text-sm sm:text-base leading-relaxed">
              GymOpsFlow ek centralized web software platform hai jo special structural approach ke sath design kiya gaya hai. Humara scale model manual system administration overhead ko khatam karta hai taaki fitness club leads aur unke owners bina technical blocks ke full control rakh sakein.
            </p>
            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
              Hum software complex settings ko bypass karke automatic delivery notifications aur accurate financial accounting tracking ko simplify karte hain.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-transparent to-white/[0.01] border border-white/5 flex flex-col justify-center h-full min-h-[220px]">
            <div className="text-indigo-400 font-mono text-xs tracking-wider uppercase mb-2">// Mission Objective</div>
            <div className="text-xl font-bold text-slate-200">"Gym software operations ko itna transparent banana jisse aapko kisi spreadsheet expert ki zaroorat na pade."</div>
          </div>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/5 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Contact Us</h2>
          <p className="mt-4 text-slate-400">Have questions about the setup or system access? Reach out directly through the official details listed below.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Email Info Card */}
          <a 
            href="mailto:gymopsflow@gmail.com" 
            className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
              <Mail className="h-5 w-5 text-indigo-400 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Email Address</div>
              <div className="text-base font-semibold text-white mt-0.5 break-all">gymopsflow@gmail.com</div>
            </div>
          </a>

          {/* Phone Info Card */}
          <a 
            href="tel:+919172001155" 
            className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
              <Phone className="h-5 w-5 text-emerald-400 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Phone Helpline</div>
              <div className="text-base font-semibold text-white mt-0.5">+91 9172001155</div>
            </div>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} GymOpsFlow. All rights reserved.</div>
          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL CONTAINER */}
      {showLogin && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto p-4 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 sm:p-10 relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
