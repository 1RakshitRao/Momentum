"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fetchWins, fetchMomentum, getStrengths } from "@/lib/api";
import type { Win } from "@/lib/api";

const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function WinsPage() {
  const [wins, setWins] = useState<Win[]>([]);
  const [stats, setStats] = useState({ brave_starts: 0, quests_completed: 0, comeback_count: 0 });
  const [identity, setIdentity] = useState("You are someone who starts hard things and comes back after stopping.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchWins(), fetchMomentum(), getStrengths()]).then(([w, m, s]) => {
      if (w) setWins(w);
      if (m) setStats({ brave_starts: m.brave_starts_this_week, quests_completed: m.quests_completed, comeback_count: m.comeback_count });
      if (s?.strengths?.[0]) setIdentity(s.strengths[0].affirmation);
      setLoading(false);
    });
  }, []);

  const typeIcon: Record<string, { bg: string; icon: string; glow: string }> = {
    brave_start: { bg: "bg-[#fbbf24]", icon: "bolt", glow: "shadow-[0_0_15px_rgba(251,191,36,0.4)]" },
    completion: { bg: "bg-[#4edea3]", icon: "check", glow: "shadow-[0_0_15px_rgba(78,222,163,0.4)]" },
    comeback: { bg: "bg-[#ca8100]", icon: "replay", glow: "shadow-[0_0_15px_rgba(202,129,0,0.4)]" },
  };

  return (
    <div className="font-kid text-on-surface overflow-x-hidden pb-24"
      style={{ background: "radial-gradient(circle at top right, #1a1535 0%, #0f0e1a 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 0)", backgroundSize: "40px 40px", opacity: 0.1 }} />

      <main className="relative z-10 px-6 pt-8 max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-[#fbbf24] flex items-center gap-2">
            Your superpowers
            <span className="material-symbols-outlined text-[#fbbf24]">bolt</span>
          </h1>
        </header>

        {/* Identity banner */}
        <section className="relative mb-10 overflow-hidden">
          <div className="bg-pink-500 p-6 rounded-2xl relative z-10 shadow-[0_15px_30px_rgba(244,114,182,0.3)] min-h-[160px] flex flex-col justify-center">
            <p className="text-white text-xl font-kid font-bold leading-tight max-w-[70%]">{identity}</p>
            {/* Zap waving (CSS blob) */}
            <div className="absolute -right-2 -bottom-4 w-32 h-32 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 bg-[#fbbf24] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              >
                <span className="text-2xl">👋</span>
              </motion.div>
            </div>
          </div>
          <div className="absolute inset-0 bg-white/5 blur-xl -z-10 rounded-2xl translate-y-2" />
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3 mb-10">
          {[
            { val: stats.brave_starts, label: "Times started" },
            { val: stats.comeback_count, label: "Came back" },
            { val: stats.quests_completed, label: "Quests finished" },
          ].map(({ val, label }) => (
            <div key={label} className="bg-[#1b1b20] p-4 rounded-2xl flex flex-col items-center text-center border border-white/5">
              <span className="text-3xl font-kid font-black text-[#fbbf24] mb-1">{loading ? "–" : val}</span>
              <span className="text-[11px] font-kid font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </section>

        {/* Brave timeline */}
        <section className="mb-12">
          <h2 className="text-lg font-kid font-bold mb-6 text-on-surface/80 flex items-center gap-2">Your Brave Journey</h2>
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#1b1b20] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : wins.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-5xl block mb-3">🌱</span>
              <p className="font-kid text-on-surface-variant">Your journey is just beginning!</p>
            </div>
          ) : (
            <div className="relative pl-8 border-l-4 border-dashed border-white/10 ml-4 space-y-10">
              {wins.slice(0, 8).map((win, i) => {
                const style = typeIcon[win.type] || typeIcon.brave_start;
                return (
                  <motion.div key={win.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                    <div className={`absolute -left-[44px] top-0 w-10 h-10 ${style.bg} rounded-full flex items-center justify-center ${style.glow}`}>
                      <span className="material-symbols-outlined text-[#0a0a0f] font-bold">{style.icon}</span>
                    </div>
                    <h3 className="font-kid font-bold text-lg text-white">{win.identity_statement || win.type}</h3>
                    <p className="text-on-surface-variant font-kid text-sm">{win.description}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Find strength CTA */}
        <section className="flex justify-center mb-10">
          <Link href="/social" className="w-full">
            <button className="w-full h-14 rounded-full text-white font-kid font-extrabold text-lg flex items-center justify-center gap-2 bg-pink-500 shadow-[0_8px_20px_rgba(244,114,182,0.4)] hover:scale-105 active:scale-95 transition-all">
              Find my strength ✨
            </button>
          </Link>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#13131a]/80 backdrop-blur-md flex justify-around items-center px-4 pb-6 h-24 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-3xl">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all ${href === "/wins" ? "text-[#fbbf24] border-t-2 border-[#fbbf24] -mt-px" : "text-slate-500 hover:text-[#fbbf24]"}`}>
            <span className="material-symbols-outlined" style={href === "/wins" ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-kid text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
