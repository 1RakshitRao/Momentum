"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { saveProfile } from "@/lib/api";

const KID_STRUGGLES = [
  { id: "getting_started", emoji: "🚀", label: "Getting Started" },
  { id: "staying_focused", emoji: "🎯", label: "Staying Focused" },
  { id: "transitions", emoji: "🔄", label: "Switching Tasks" },
  { id: "feelings", emoji: "😤", label: "Big Feelings" },
  { id: "social", emoji: "👫", label: "Making Friends" },
  { id: "memory", emoji: "🧩", label: "Remembering Things" },
  { id: "sleep", emoji: "😴", label: "Getting to Bed" },
  { id: "bullying", emoji: "🛡️", label: "Being Treated Badly" },
  { id: "school", emoji: "📚", label: "School Work" },
  { id: "anger", emoji: "🌋", label: "Getting Angry" },
  { id: "anxiety", emoji: "😰", label: "Feeling Worried" },
  { id: "overwhelmed", emoji: "🌊", label: "Overwhelmed" },
];

const STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { setProfile, setOnboarded } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const progress = ((step + 1) / STEPS) * 100;

  async function finish() {
    setLoading(true);
    const p = { name, age: parseInt(age) || 10, mode: "kid" as const, struggles: [], kid_struggles: selected };
    setProfile(p);
    await saveProfile(p);
    setOnboarded(true);
    setLoading(false);
    router.push("/now");
  }

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex flex-col items-center justify-start px-6 py-6 relative overflow-hidden">
      <div className="fixed inset-0 star-field opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col" style={{ minHeight: "calc(100dvh - 3rem)" }}>
        {/* Progress */}
        <div className="mb-4">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#fbbf24] rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <p className="text-[#908fa0] text-xs mt-1.5 font-label uppercase tracking-widest">Step {step + 1} of {STEPS}</p>
        </div>

        <div className={`flex-1 flex flex-col ${step === 2 ? "justify-start" : "justify-center"}`}>
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="flex justify-center mb-8">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-32 h-32 flex items-center justify-center"
                  style={{ background: "radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b)", borderRadius: "45% 55% 50% 50% / 60% 60% 40% 40%", boxShadow: "0 0 30px rgba(251,191,36,0.4)" }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-4"><div className="w-3 h-4 bg-amber-950 rounded-full" /><div className="w-3 h-4 bg-amber-950 rounded-full" /></div>
                    <div className="w-6 h-2 border-b-2 border-amber-950 rounded-full" />
                  </div>
                </motion.div>
              </div>
              <h1 className="font-kid font-black text-4xl text-[#e4e1e9] mb-4">Welcome, Explorer! ⚡</h1>
              <p className="text-[#c7c4d7] font-kid text-lg mb-10">I&apos;m Zap, your helper! Let&apos;s set up your adventure together.</p>
              <button onClick={() => setStep(1)} className="w-full h-14 bg-[#fbbf24] text-amber-950 font-kid font-black text-xl rounded-full shadow-[0_6px_0_#ca8100] hover:shadow-[0_3px_0_#ca8100] hover:translate-y-1 transition-all">
                Let&apos;s Go! 🚀
              </button>
            </motion.div>
          )}

          {/* Step 1: Name & Age */}
          {step === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#fbbf24] rounded-full flex items-center justify-center" style={{ boxShadow: "0 0 20px rgba(251,191,36,0.4)" }}>
                  <span className="text-3xl">⚡</span>
                </div>
              </div>
              <h1 className="font-kid font-black text-3xl text-[#e4e1e9] mb-2 text-center">What&apos;s your name?</h1>
              <p className="text-[#c7c4d7] font-kid text-center mb-8">I want to call you by your real name!</p>
              <div className="space-y-4">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name..."
                  className="w-full bg-[#1f1f25] border-2 border-white/10 rounded-2xl px-5 py-4 text-[#e4e1e9] text-lg font-kid placeholder:text-[#908fa0] outline-none focus:border-[#fbbf24] transition-colors"
                />
                <input
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="Your age..."
                  type="number"
                  min="5" max="18"
                  className="w-full bg-[#1f1f25] border-2 border-white/10 rounded-2xl px-5 py-4 text-[#e4e1e9] text-lg font-kid placeholder:text-[#908fa0] outline-none focus:border-[#fbbf24] transition-colors"
                />
              </div>
              <button onClick={() => name.trim() && setStep(2)} disabled={!name.trim()}
                className="w-full mt-8 h-14 bg-[#fbbf24] disabled:opacity-40 text-amber-950 font-kid font-black text-xl rounded-full shadow-[0_6px_0_#ca8100] hover:shadow-[0_3px_0_#ca8100] hover:translate-y-1 transition-all">
                That&apos;s me! ✨
              </button>
            </motion.div>
          )}

          {/* Step 2: Struggles */}
          {step === 2 && (
            <motion.div key="struggles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h1 className="font-kid font-black text-xl text-[#e4e1e9] mb-0.5 text-center">Hey {name}! 👋</h1>
              <p className="text-[#c7c4d7] font-kid text-sm text-center mb-3">What feels hard for you? Pick everything that fits.</p>
              <div className="flex flex-col gap-2">
                {KID_STRUGGLES.map(({ id, emoji, label }) => {
                  const active = selected.includes(id);
                  return (
                    <motion.button key={id} whileTap={{ scale: 0.97 }} onClick={() => toggle(id)}
                      className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl border-2 transition-all ${
                        active
                          ? "border-[#fbbf24] bg-[#fbbf24]/10 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                          : "border-white/10 bg-[#1f1f25] hover:border-white/20"
                      }`}>
                      <span className="text-2xl w-8 text-center">{emoji}</span>
                      <span className={`text-sm font-kid font-bold ${active ? "text-[#fbbf24]" : "text-[#c7c4d7]"}`}>{label}</span>
                      {active && <span className="ml-auto text-[#fbbf24] material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </motion.button>
                  );
                })}
              </div>
              <button onClick={() => setStep(3)}
                className="w-full mt-4 h-12 bg-[#fbbf24] text-amber-950 font-kid font-black text-lg rounded-full shadow-[0_5px_0_#ca8100] hover:shadow-[0_3px_0_#ca8100] hover:translate-y-0.5 transition-all">
                {selected.length > 0 ? `Got it! (${selected.length} selected)` : "Skip for now"} →
              </button>
            </motion.div>
          )}

          {/* Step 3: All set */}
          {step === 3 && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 flex items-center justify-center"
                  style={{ background: "radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b)", borderRadius: "45% 55% 50% 50% / 60% 60% 40% 40%", boxShadow: "0 0 30px rgba(251,191,36,0.4)" }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-4"><div className="w-3 h-4 bg-amber-950 rounded-full" /><div className="w-3 h-4 bg-amber-950 rounded-full" /></div>
                    <div className="w-8 h-2 border-b-2 border-amber-950 rounded-full" />
                  </div>
                </motion.div>
              </div>
              <h1 className="font-kid font-black text-3xl text-[#e4e1e9] mb-3">All set, {name}! 🎉</h1>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {selected.slice(0, 4).map(id => {
                    const s = KID_STRUGGLES.find(k => k.id === id)!;
                    return (
                      <span key={id} className="px-3 py-1 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-full text-xs font-kid font-bold text-[#fbbf24]">
                        {s.emoji} {s.label}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="text-[#908fa0] font-kid text-sm mb-10">I set up special help for you! You can talk to me using your voice or tap things on screen.</p>
              <button onClick={finish} disabled={loading}
                className="w-full h-14 bg-[#fbbf24] disabled:opacity-60 text-amber-950 font-kid font-black text-xl rounded-full shadow-[0_6px_0_#ca8100] hover:shadow-[0_3px_0_#ca8100] hover:translate-y-1 transition-all">
                {loading ? "Setting up... ✨" : "Start My Adventure! ⚡"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
