"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { getMicroSteps, braveStart, completeTask as apiComplete, speakText } from "@/lib/api";
import type { MicroStep } from "@/lib/api";

type Phase = "loading" | "estimate" | "active" | "done";

const TIME_PRESETS = [5, 10, 15, 20, 30];

function ZapFace({ speaking = false, size = 96 }: { speaking?: boolean; size?: number }) {
  const s = size;
  return (
    <motion.div
      animate={speaking
        ? { scale: [1, 1.06, 1, 1.04, 1], y: [0, -3, 0, -2, 0] }
        : { y: [0, -5, 0] }
      }
      transition={{ repeat: Infinity, duration: speaking ? 0.5 : 2.5 }}
      className="rounded-full relative flex items-center justify-center flex-shrink-0"
      style={{
        width: s, height: s,
        background: "#fbbf24",
        boxShadow: speaking
          ? `0 0 ${s / 2}px rgba(251,191,36,0.7)`
          : `0 0 ${s / 3}px rgba(251,191,36,0.4)`,
      }}
    >
      {/* Cheeks */}
      <div className="absolute rounded-full bg-[#f59e0b]/60"
        style={{ width: s * 0.22, height: s * 0.12, left: s * 0.06, top: "54%" }} />
      <div className="absolute rounded-full bg-[#f59e0b]/60"
        style={{ width: s * 0.22, height: s * 0.12, right: s * 0.06, top: "54%" }} />
      {/* Left eye */}
      <div className="absolute" style={{ left: "27%", top: "34%" }}>
        <div className="bg-[#451a03] rounded-full" style={{ width: s * 0.13, height: s * 0.16 }} />
        <div className="bg-white rounded-full opacity-70 absolute" style={{ width: s * 0.05, height: s * 0.05, top: "10%", left: "40%" }} />
      </div>
      {/* Right eye */}
      <div className="absolute" style={{ right: "27%", top: "34%" }}>
        <div className="bg-[#451a03] rounded-full" style={{ width: s * 0.13, height: s * 0.16 }} />
        <div className="bg-white rounded-full opacity-70 absolute" style={{ width: s * 0.05, height: s * 0.05, top: "10%", left: "40%" }} />
      </div>
      {/* Mouth */}
      {speaking ? (
        <div className="absolute bg-[#451a03] rounded-full"
          style={{ width: s * 0.3, height: s * 0.18, bottom: "20%" }} />
      ) : (
        <svg className="absolute" style={{ bottom: "18%", width: s * 0.42, height: s * 0.18 }} viewBox="0 0 42 18" fill="none">
          <path d="M3 3 Q21 18 39 3" stroke="#451a03" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </svg>
      )}
    </motion.div>
  );
}

export default function GuidancePage() {
  const router = useRouter();
  const { activeTask, completeTask, profile } = useApp();
  const [steps, setSteps] = useState<MicroStep[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");

  // Time estimate
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState("");

  // Nudge state
  const [nudge1Visible, setNudge1Visible] = useState(false);   // 10% — on-screen
  const [nudge2Visible, setNudge2Visible] = useState(false);   // 40% — voice + screen
  const [zapSpeaking, setZapSpeaking] = useState(false);
  const [nudge1Fired, setNudge1Fired] = useState(false);
  const [nudge2Fired, setNudge2Fired] = useState(false);
  const [elapsedPct, setElapsedPct] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalMsRef = useRef<number>(0);

  useEffect(() => {
    if (!activeTask) { router.push("/now"); return; }
    getMicroSteps(activeTask.id).then((r) => {
      if (r?.steps?.length) { setSteps(r.steps); braveStart(activeTask.id); }
      setPhase("estimate");
    });
  }, [activeTask]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startNudgeTimer = useCallback((minutes: number) => {
    const totalMs = minutes * 60 * 1000;
    totalMsRef.current = totalMs;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - startTimeRef.current) / totalMsRef.current) * 100, 100);
      setElapsedPct(pct);

      if (pct >= 10 && !nudge1Fired) {
        setNudge1Fired(true);
        setNudge1Visible(true);
      }
      if (pct >= 40 && !nudge2Fired) {
        setNudge2Fired(true);
        setNudge2Visible(true);
        const name = profile?.name ? `, ${profile.name}` : "";
        const taskName = activeTask?.quest_title || activeTask?.task_name || "your task";
        const nudgeText = `Hey${name}! Just checking in — are you still working on ${taskName}? You're doing amazing! Keep going, I believe in you!`;
        setZapSpeaking(true);
        speakText(nudgeText).then(() => setTimeout(() => setZapSpeaking(false), 6000));
      }
      if (pct >= 100 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 2000);
  }, [nudge1Fired, nudge2Fired, activeTask, profile]);

  function confirmEstimate() {
    const mins = estimatedMinutes ?? parseInt(customTime);
    if (!mins || mins < 1) return;
    setPhase("active");
    startNudgeTimer(mins);
  }

  async function handleDone() {
    if (!activeTask) return;
    if (current < steps.length - 1) { setCurrent((c) => c + 1); return; }
    if (timerRef.current) clearInterval(timerRef.current);
    await apiComplete(activeTask.id);
    completeTask(activeTask.id);
    setPhase("done");
    setTimeout(() => router.push("/wins"), 2500);
  }

  if (!activeTask) return null;
  const step = steps[current];
  const questName = activeTask.quest_title || activeTask.task_name;
  const confirmMins = estimatedMinutes ?? (customTime ? parseInt(customTime) : null);

  return (
    <div className="bg-[#0f0e1a] text-on-surface font-kid min-h-screen flex flex-col overflow-hidden">
      <div className="fixed inset-0 star-field opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-[#0f0e1a] pointer-events-none" />

      {/* ── Level 1 nudge — gentle on-screen ── */}
      <AnimatePresence>
        {nudge1Visible && (
          <motion.div
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm"
          >
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-[#fbbf24]/30"
              style={{ background: "rgba(31,31,37,0.95)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span className="text-2xl">⚡</span>
              <div className="flex-1">
                <p className="font-kid font-black text-[#fbbf24] text-sm">Still going?</p>
                <p className="font-kid text-[#c7c4d7] text-xs mt-0.5">You started — that was the hardest part. Keep it up!</p>
              </div>
              <button onClick={() => setNudge1Visible(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white/60 text-sm">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Level 2 nudge — voice + screen ── */}
      <AnimatePresence>
        {nudge2Visible && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center pb-32 pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4 pointer-events-auto">
              <ZapFace speaking={zapSpeaking} size={80} />
              <div className="px-6 py-4 rounded-3xl border border-[#fbbf24]/40 max-w-xs text-center"
                style={{ background: "rgba(31,31,37,0.96)", backdropFilter: "blur(16px)", boxShadow: "0 8px 40px rgba(251,191,36,0.15)" }}>
                {zapSpeaking ? (
                  <>
                    <div className="flex gap-1 items-end h-4 justify-center mb-2">
                      {[3,5,4,6,3,5,4].map((h, i) => (
                        <motion.div key={i} animate={{ height: [`${h}px`, `${h*2}px`, `${h}px`] }}
                          transition={{ repeat: Infinity, duration: 0.35 + i * 0.07, delay: i * 0.06 }}
                          className="w-1 bg-[#fbbf24] rounded-full" />
                      ))}
                    </div>
                    <p className="font-kid font-black text-[#fbbf24] text-sm">Zap is checking in...</p>
                  </>
                ) : (
                  <>
                    <p className="font-kid font-black text-[#fbbf24] text-sm mb-1">Are you still on it? 💪</p>
                    <p className="font-kid text-[#c7c4d7] text-xs">You&apos;re almost halfway through your time. You&apos;ve got this!</p>
                  </>
                )}
              </div>
              <button onClick={() => setNudge2Visible(false)}
                className="px-6 py-2 bg-[#fbbf24] text-[#2a1700] font-kid font-black text-sm rounded-full">
                Yes, I&apos;m on it! ⚡
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex-1 flex flex-col items-center px-6 pt-12 pb-32 max-w-lg mx-auto w-full z-10">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {phase === "loading" && (
            <motion.div key="loading" className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-4 border-[#fbbf24]/30 border-t-[#fbbf24]" />
                <p className="text-on-surface-variant font-kid font-bold">Zap is preparing your quest...</p>
              </div>
            </motion.div>
          )}

          {/* ── Time Estimate ── */}
          {phase === "estimate" && (
            <motion.div key="estimate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center gap-6 pt-4">

              <ZapFace size={100} />

              {/* Speech bubble */}
              <div className="relative w-full rounded-[32px] p-6 text-center"
                style={{ background: "rgba(53,52,58,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45"
                  style={{ background: "rgba(53,52,58,0.5)", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", borderRight: "none" }} />
                <p className="text-lg font-kid font-black text-white leading-snug">
                  Awesome! Let&apos;s do <span className="text-[#fbbf24]">&quot;{questName}&quot;</span>
                </p>
                <p className="text-[#c7c4d7] font-kid font-bold text-sm mt-2">
                  How long do you think it will take?
                </p>
              </div>

              {/* Preset time buttons */}
              <div className="grid grid-cols-5 gap-2 w-full">
                {TIME_PRESETS.map((mins) => (
                  <motion.button key={mins} whileTap={{ scale: 0.93 }}
                    onClick={() => { setEstimatedMinutes(mins); setCustomTime(""); }}
                    className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${
                      estimatedMinutes === mins
                        ? "border-[#fbbf24] bg-[#fbbf24]/15 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
                        : "border-white/10 bg-[#1f1f25] hover:border-white/20"
                    }`}>
                    <span className={`font-kid font-black text-lg ${estimatedMinutes === mins ? "text-[#fbbf24]" : "text-white"}`}>
                      {mins}
                    </span>
                    <span className={`font-kid text-[10px] font-bold ${estimatedMinutes === mins ? "text-[#fbbf24]/70" : "text-[#908fa0]"}`}>
                      min
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Custom input */}
              <div className="w-full flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[#908fa0] font-kid text-xs font-bold uppercase tracking-widest">or type it</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="w-full flex items-center gap-3">
                <input
                  type="number"
                  min={1} max={180}
                  value={customTime}
                  onChange={(e) => { setCustomTime(e.target.value); setEstimatedMinutes(null); }}
                  placeholder="e.g. 25"
                  className="flex-1 h-14 bg-[#1f1f25] border-2 border-white/10 rounded-2xl px-5 text-white font-kid font-bold text-lg outline-none focus:border-[#fbbf24] transition-colors"
                />
                <span className="text-[#c7c4d7] font-kid font-bold text-sm">minutes</span>
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={confirmEstimate}
                disabled={!confirmMins || confirmMins < 1}
                className="w-full h-16 bg-[#fbbf24] disabled:opacity-40 text-[#2a1700] font-kid font-black text-xl rounded-full shadow-[0_8px_0_#ca8100] hover:shadow-[0_4px_0_#ca8100] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Let&apos;s Go! ⚡
              </motion.button>
            </motion.div>
          )}

          {/* ── Active steps ── */}
          {phase === "active" && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">

              {/* Timer bar */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-kid font-bold text-[#908fa0] text-xs uppercase tracking-widest">Time used</span>
                  <span className="font-kid font-bold text-[#fbbf24] text-xs">{Math.round(elapsedPct)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ width: `${elapsedPct}%`, background: elapsedPct > 80 ? "#ef4444" : elapsedPct > 40 ? "#f59e0b" : "#4edea3" }}
                    animate={{ width: `${elapsedPct}%` }} transition={{ duration: 1 }} />
                </div>
              </div>

              {/* Zap */}
              <div className="relative mb-8">
                <ZapFace size={88} speaking={zapSpeaking} />
                <span className="material-symbols-outlined absolute -top-2 -right-2 text-[#fbbf24] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>

              {/* Speech bubble */}
              <div className="relative w-full rounded-[32px] p-6 text-center shadow-xl mb-8"
                style={{ background: "rgba(53,52,58,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45"
                  style={{ background: "rgba(53,52,58,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", borderRight: "none" }} />
                <AnimatePresence mode="wait">
                  <motion.p key={current} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="text-xl font-kid font-bold leading-tight text-white italic">
                    &quot;{step ? step.action : activeTask.first_step}&quot;
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Step card */}
              <div className="w-full rounded-[40px] p-8 mb-8 flex flex-col items-center text-center"
                style={{ background: "rgba(53,52,58,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-20 h-20 bg-[#35343a] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-[#fbbf24]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {current === 0 ? "play_arrow" : "star"}
                  </span>
                </div>
                <h2 className="text-xl font-kid font-bold text-on-surface-variant">
                  {questName} — Step {current + 1} of {steps.length || 1}
                </h2>
                <div className="flex gap-2 mt-6">
                  {Array.from({ length: steps.length || 3 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[#fbbf24]"
                      style={{ fontVariationSettings: `'FILL' ${i <= current ? 1 : 0}`, opacity: i <= current ? 1 : 0.2 }}>star</span>
                  ))}
                </div>
              </div>

              <button onClick={handleDone}
                className="w-full h-14 bg-[#fbbf24] text-[#2a1700] font-kid font-black text-lg rounded-full shadow-[0_6px_0_#ca8100] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                {current < steps.length - 1 ? "Done this step! ✓" : "Quest Complete! 🎉"}
                <span className="material-symbols-outlined">rocket_launch</span>
              </button>
            </motion.div>
          )}

          {/* ── Done ── */}
          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-6">
              <motion.span animate={{ rotate: [0, 15, -15, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-8xl block">🎉</motion.span>
              <h1 className="font-kid font-black text-4xl text-white">Quest Complete!</h1>
              <p className="text-on-surface-variant font-kid text-lg">You did it! Heading to your wins...</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Progress path — only during active */}
      {phase === "active" && (
        <div className="fixed bottom-0 left-0 w-full h-48 pointer-events-none z-20">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
            <path d="M-50,180 C50,180 100,120 200,120 C300,120 350,180 450,180" fill="none" stroke="rgba(251,191,36,0.2)" strokeLinecap="round" strokeWidth="12" />
            <path d={`M-50,180 C50,180 100,120 ${Math.min(120 + current * 60, 200)},120`} fill="none" stroke="#fbbf24" strokeLinecap="round" strokeWidth="12" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-around px-4">
            {(steps.length > 0 ? steps : [null]).map((_, i) => (
              <div key={i} className={`relative ${i === 0 ? "translate-y-20 -translate-x-8" : i === 1 ? "-translate-y-4" : `translate-y-${(i+1)*4} translate-x-${i*4}`}`}>
                <div className={`${i < current ? "w-10 h-10 bg-[#fbbf24] shadow-[0_0_15px_#fbbf24]" : i === current ? "w-14 h-14 bg-[#fbbf24] shadow-[0_0_25px_#fbbf24] animate-pulse" : "w-10 h-10 bg-white/10 border-2 border-white/20"} rounded-full flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[#2a1700] text-lg" style={{ fontVariationSettings: `'FILL' ${i <= current ? 1 : 0}` }}>
                    {i < current ? "check" : i === current ? "star" : "lock"}
                  </span>
                </div>
                {i === current && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    <span className="text-[10px] font-kid font-bold text-[#fbbf24] uppercase tracking-widest">Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close */}
      <button onClick={() => router.push("/now")} className="fixed top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-50"
        style={{ background: "rgba(53,52,58,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="material-symbols-outlined text-white/60">close</span>
      </button>
    </div>
  );
}
