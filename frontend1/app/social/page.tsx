"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getSocialRehearsal } from "@/lib/api";

const SCENARIOS = [
  { emoji: "🏫", label: "School Hallway", color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300", scenario: "I'm walking in the school hallway and I want to say hi to someone" },
  { emoji: "🙋‍♂️", label: "Asking for help", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", scenario: "I need to ask my teacher for help with something I don't understand" },
  { emoji: "🍽️", label: "Lunch Table", color: "bg-amber-500/10 border-amber-500/20 text-amber-300", scenario: "I want to sit with someone at lunch but don't know how to ask" },
  { emoji: "🏀", label: "Joining a Game", color: "bg-pink-500/10 border-pink-500/20 text-pink-300", scenario: "I want to join a game that other kids are playing" },
  { emoji: "🚌", label: "Bus Seat Buddy", color: "bg-violet-500/10 border-violet-500/20 text-violet-300", scenario: "I want to sit next to someone on the bus" },
  { emoji: "🏠", label: "Visiting Family", color: "bg-sky-500/10 border-sky-500/20 text-sky-300", scenario: "I have to talk to adults I don't know at a family gathering" },
];

const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

interface Rehearsal {
  what_to_say: string; practice_line: string; affirmation: string;
  when_to_walk_away: string; when_to_get_adult: string;
}

export default function SocialPage() {
  const [active, setActive] = useState<typeof SCENARIOS[0] | null>(null);
  const [result, setResult] = useState<Rehearsal | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  async function practice(s: typeof SCENARIOS[0], idx: number) {
    setActive(s);
    setSelected(idx);
    setLoading(true);
    const r = await getSocialRehearsal(s.scenario);
    if (r) setResult(r as Rehearsal);
    setLoading(false);
  }

  return (
    <div className="bg-[#131318] font-kid text-on-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f1f25] flex items-center justify-center text-[#fbbf24]">
            <span className="material-symbols-outlined">child_care</span>
          </div>
          <span className="font-headline italic text-2xl text-indigo-400">Momentum</span>
        </div>
        <Link href="/settings">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </Link>
      </header>

      <main className="min-h-screen pt-20 pb-32 px-6" style={{ background: "linear-gradient(to bottom, #0f0e1a, #2d1b4e)" }}>
        {/* Active scenario coaching */}
        <AnimatePresence>
          {active && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-md mx-auto mb-12"
            >
              <div className="flex flex-col items-center gap-6">
                {/* Zap */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="relative w-32 h-32 flex items-center justify-center bg-[#fbbf24] rounded-full cursor-pointer"
                  style={{ boxShadow: "0 0 30px rgba(251,191,36,0.3)" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                    <div className="w-20 h-20 bg-white/20 blur-xl animate-pulse" />
                  </div>
                  <div className="z-10 flex flex-col gap-1">
                    <div className="flex gap-4">
                      <div className="w-3 h-3 bg-indigo-950 rounded-full" />
                      <div className="w-3 h-3 bg-indigo-950 rounded-full" />
                    </div>
                    <div className="w-8 h-2 bg-indigo-950 rounded-full mx-auto mt-1" />
                  </div>
                </motion.div>

                {/* Coaching card */}
                {loading ? (
                  <div className="w-full bg-[#1f1f25] p-6 rounded-3xl border border-white/5 text-center">
                    <div className="animate-pulse text-[#fbbf24] font-kid font-bold">Zap is coaching you... ✨</div>
                  </div>
                ) : result ? (
                  <div className="w-full space-y-3">
                    {/* Speech bubble */}
                    <div className="relative w-full bg-[#1f1f25] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                      <p className="text-lg font-kid font-bold leading-relaxed text-on-surface">
                        "{result.what_to_say}"
                      </p>
                    </div>
                    {/* Response options */}
                    <div className="w-full flex flex-col gap-4">
                      <button className="w-full h-14 flex items-center justify-center px-6 bg-[#2a292f] rounded-full border-2 border-[#fbbf24] shadow-[0_4px_0_rgba(251,191,36,0.2)] relative">
                        <span className="absolute -top-3 right-6 bg-[#fbbf24] text-indigo-950 text-[10px] font-kid font-black px-2 py-0.5 rounded-full uppercase">Remember this ⭐</span>
                        <span className="text-on-surface font-kid font-bold text-lg">"{result.practice_line}"</span>
                      </button>
                    </div>
                    {/* Affirmation */}
                    <div className="px-8 py-3 bg-red-400/10 rounded-full border border-red-400/20 text-center">
                      <p className="text-error text-center font-kid font-extrabold italic">Zap says: {result.affirmation} ⚡</p>
                    </div>
                    <button onClick={() => { setActive(null); setResult(null); setSelected(null); }}
                      className="w-full h-12 text-slate-400 font-kid font-bold text-sm uppercase tracking-widest">
                      ← Back to scenarios
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Scenario list */}
        {!active && (
          <>
            <div className="max-w-md mx-auto mb-6 flex justify-between items-end pt-4">
              <h2 className="text-2xl font-kid font-black text-on-surface-variant">Pick a Challenge</h2>
              <span className="text-[#fbbf24] font-kid font-bold text-sm">{SCENARIOS.length} Situations</span>
            </div>
            <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
              {SCENARIOS.map((s, i) => (
                <motion.div key={s.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className={`p-5 rounded-[2.5rem] flex flex-col items-center gap-3 border text-center cursor-pointer ${s.color}`}
                  onClick={() => practice(s, i)}>
                  <div className="text-4xl">{s.emoji}</div>
                  <h3 className="font-kid font-bold text-on-surface text-base">{s.label}</h3>
                  <button className={`mt-auto px-4 py-2 rounded-full text-xs font-kid font-black uppercase tracking-widest ${s.color}`}>
                    Practice this →
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-[#13131a]/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-3xl">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all text-slate-500 hover:text-indigo-300`}>
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-kid text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
