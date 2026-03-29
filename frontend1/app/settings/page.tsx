"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { seedDemo } from "@/lib/api";

const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, setOnboarded, parentPin, setParentUnlocked, refreshTasks } = useApp();
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  function goParent() {
    const pin = window.prompt("Enter parent PIN to access Parent Dashboard:");
    if (!pin) return;
    if (pin === parentPin) {
      setParentUnlocked(true);
      router.push("/parent");
    } else {
      window.alert("Incorrect PIN.");
    }
  }

  function resetApp() {
    if (window.confirm("Reset your profile? You'll go through onboarding again.")) {
      setOnboarded(false);
      router.push("/onboarding");
    }
  }

  async function loadDemoData() {
    setSeeding(true);
    const ok = await seedDemo();
    if (ok) {
      await refreshTasks();
      setSeedDone(true);
      setTimeout(() => setSeedDone(false), 3000);
    }
    setSeeding(false);
  }

  return (
    <div className="bg-[#0f0e1a] text-on-surface font-kid min-h-screen">
      <div className="fixed inset-0 star-field opacity-20 pointer-events-none" />

      <main className="relative z-10 max-w-md mx-auto px-6 pt-10 pb-32">
        <h1 className="font-kid font-black text-4xl text-on-surface mb-1">Settings ⚙️</h1>
        <p className="text-outline text-sm mb-8 font-kid">
          Hey {profile.name}! Age {profile.age || "?"}.
        </p>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f1f25] rounded-3xl p-6 mb-6 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#fbbf24]/20 flex items-center justify-center text-3xl">
              ⚡
            </div>
            <div>
              <h2 className="font-kid font-black text-xl text-on-surface">{profile.name}</h2>
              <p className="text-outline font-kid text-sm">Age {profile.age || "?"} · Explorer</p>
            </div>
          </div>
          {profile.kid_struggles?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.kid_struggles.map((s: string) => (
                <span key={s} className="px-3 py-1 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-full text-xs font-kid font-bold text-[#fbbf24]">
                  {s.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Menu items */}
        <div className="space-y-3">
          <Link href="/social">
            <button className="w-full bg-[#1f1f25] rounded-2xl p-5 flex items-center gap-4 border border-white/5 hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <span className="material-symbols-outlined">people</span>
              </div>
              <div className="text-left">
                <h3 className="font-kid font-bold text-on-surface">Social Practice</h3>
                <p className="text-outline text-xs font-kid">Practice conversations with Zap</p>
              </div>
              <span className="ml-auto material-symbols-outlined text-outline">chevron_right</span>
            </button>
          </Link>

          <button onClick={resetApp}
            className="w-full bg-[#1f1f25] rounded-2xl p-5 flex items-center gap-4 border border-white/5 hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined">refresh</span>
            </div>
            <div className="text-left">
              <h3 className="font-kid font-bold text-on-surface">Update Profile</h3>
              <p className="text-outline text-xs font-kid">Change your name, age, or struggles</p>
            </div>
            <span className="ml-auto material-symbols-outlined text-outline">chevron_right</span>
          </button>

          {/* Parent dashboard - PIN protected */}
          <button onClick={goParent}
            className="w-full bg-[#1f1f25] rounded-2xl p-5 flex items-center gap-4 border border-white/5 hover:border-[#c0c1ff]/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#c0c1ff]/10 flex items-center justify-center text-[#c0c1ff]">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div className="text-left">
              <h3 className="font-kid font-bold text-on-surface">Parent Dashboard</h3>
              <p className="text-outline text-xs font-kid">PIN protected — for grown-ups only</p>
            </div>
            <span className="ml-auto material-symbols-outlined text-outline">chevron_right</span>
          </button>
        </div>

        {/* Demo data loader */}
        <div className="mt-6 p-5 rounded-3xl border-2 border-dashed border-[#fbbf24]/30 bg-[#fbbf24]/5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h3 className="font-kid font-black text-[#fbbf24] text-sm">Demo Mode</h3>
              <p className="text-outline text-[11px] font-kid">Load Alex's full demo data — tasks, calendar, wins & check-ins</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={loadDemoData}
            disabled={seeding}
            className="w-full h-12 rounded-2xl font-kid font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: seedDone ? "#4edea3" : "#fbbf24", color: "#2a1700" }}
          >
            {seeding ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-[#2a1700]/30 border-t-[#2a1700]" />
                Loading demo data...
              </>
            ) : seedDone ? (
              <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Demo data loaded!</>
            ) : (
              <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> Load Demo Data</>
            )}
          </motion.button>
        </div>

        {/* App info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] text-outline tracking-widest uppercase font-label">
            <span className="material-symbols-outlined text-xs">verified_user</span>
            Momentum v1.0 · Cognitive Sanctuary
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-[#13131a]/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-3xl">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all ${href === "/settings" ? "text-[#fbbf24] border-t-2 border-[#fbbf24] -mt-px" : "text-slate-500 hover:text-indigo-300"}`}>
            <span className="material-symbols-outlined" style={href === "/settings" ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-kid font-black text-[10px] tracking-widest uppercase">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
