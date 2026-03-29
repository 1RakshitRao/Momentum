"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { submitCheckIn, transcribeAudio, playAudio } from "@/lib/api";
import type { CheckInResult } from "@/lib/api";

const FEELINGS = [
  { emoji: "😊", label: "Happy" }, { emoji: "🤩", label: "Excited" }, { emoji: "😴", label: "Tired" },
  { emoji: "😟", label: "Worried" }, { emoji: "😌", label: "Calm" }, { emoji: "😤", label: "Angry" },
  { emoji: "😔", label: "Sad" }, { emoji: "🤯", label: "Frustrated" }, { emoji: "🤔", label: "Focused" },
  { emoji: "🤪", label: "Silly" }, { emoji: "🤗", label: "Loved" }, { emoji: "😶", label: "Quiet" },
];

const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

interface CheckInResultWithAudio extends CheckInResult {
  audio_b64?: string;
}

export default function FeelingsPage() {
  const { profile } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CheckInResultWithAudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [zapSpeaking, setZapSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startVoiceInput() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const text = await transcribeAudio(blob);
        if (text) setMessage(text);
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      // mic not available
    }
  }

  function stopVoiceInput() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    if (!selected) return;
    setLoading(true);
    const r = await submitCheckIn(selected, message) as CheckInResultWithAudio | null;
    if (r) {
      setResult(r);
      // Auto-play Zap's calming voice response
      if (r.audio_b64) {
        setZapSpeaking(true);
        playAudio(r.audio_b64);
        // Estimate ~5s speaking time then stop animation
        setTimeout(() => setZapSpeaking(false), 5000);
      }
    }
    setLoading(false);
  }

  function reset() {
    setResult(null);
    setSelected(null);
    setMessage("");
    setZapSpeaking(false);
  }

  return (
    <div style={{ background: "linear-gradient(to bottom, #1a1635, #0f0e1a)" }} className="min-h-screen text-[#e4e1e9] overflow-x-hidden">
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-10 w-1 h-1 bg-white rounded-full opacity-40" />
        <div className="absolute top-1/2 right-20 w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-20" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[#fbbf24] rounded-full opacity-30" />
        <div className="absolute top-10 right-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-60" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f1f25] flex items-center justify-center text-[#fbbf24] font-kid font-black text-lg">
            {profile.name?.charAt(0)?.toUpperCase() || "Z"}
          </div>
          <span className="font-headline italic text-2xl text-indigo-400">Momentum</span>
        </div>
        <Link href="/settings">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10">
            <span className="material-symbols-outlined text-indigo-400">settings</span>
          </button>
        </Link>
      </header>

      <main className="pt-20 pb-32 px-6 max-w-lg mx-auto relative">
        {/* Zap — top right, speaks when result arrives */}
        <div className="absolute -right-2 top-16 w-28 h-28 pointer-events-none">
          <motion.div
            animate={zapSpeaking
              ? { scale: [1, 1.08, 1, 1.06, 1], y: [0, -4, 0, -3, 0] }
              : { y: [0, -4, 0] }
            }
            transition={{ repeat: Infinity, duration: zapSpeaking ? 0.6 : 2.5 }}
            className="w-24 h-24 bg-[#fbbf24] rounded-full relative flex items-center justify-center"
            style={{ boxShadow: zapSpeaking ? "0 0 30px rgba(251,191,36,0.6)" : "0 0 20px rgba(251,191,36,0.3)" }}
          >
            {/* Cheeks */}
            <div className="absolute w-6 h-3 rounded-full bg-[#f59e0b]/60 left-1.5 top-[52%]" />
            <div className="absolute w-6 h-3 rounded-full bg-[#f59e0b]/60 right-1.5 top-[52%]" />
            {/* Eyes */}
            <div className="absolute left-[26%] top-[35%]">
              <div className="w-3 h-4 bg-[#451a03] rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full -mt-3 ml-0.5 opacity-70" />
            </div>
            <div className="absolute right-[26%] top-[35%]">
              <div className="w-3 h-4 bg-[#451a03] rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full -mt-3 ml-0.5 opacity-70" />
            </div>
            {/* Mouth */}
            {zapSpeaking
              ? <div className="absolute bottom-5 w-8 h-4 bg-[#451a03] rounded-full" />
              : (
                <svg className="absolute bottom-4" width="36" height="16" viewBox="0 0 36 16" fill="none">
                  <path d="M3 3 Q18 16 33 3" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none"/>
                </svg>
              )
            }
          </motion.div>
          {zapSpeaking && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="absolute -left-20 top-2 bg-[#1f1f25]/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-[#fbbf24]/30 whitespace-nowrap"
            >
              <p className="text-[10px] text-[#fbbf24] font-kid font-bold uppercase tracking-wider">Zap is speaking ⚡</p>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Input form ── */}
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
              <div className="mb-6 pt-2">
                <h1 className="text-2xl font-kid font-bold text-[#e4e1e9] mb-1">How are you feeling right now?</h1>
                <p className="text-[#c7c4d7] text-sm font-kid">Pick the emoji that matches your heart.</p>
              </div>

              {/* Feeling grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {FEELINGS.map(({ emoji, label }) => (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelected(label)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-3xl border-4 transition-all ${
                      selected === label
                        ? "bg-[#2a292f] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                        : "bg-[#1b1b20] border-transparent hover:bg-[#2a292f]"
                    }`}
                  >
                    <span className="text-4xl mb-1">{emoji}</span>
                    <span className={`text-xs font-kid font-bold ${selected === label ? "text-[#fbbf24]" : "text-[#c7c4d7]"}`}>{label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Text + voice input */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="You can say anything here. Zap is listening. Nothing you say is wrong."
                    className="w-full bg-[#1b1b20] border-2 border-[#ca8100]/30 rounded-3xl p-5 pr-14 text-[#e4e1e9] placeholder:text-[#908fa0]/60 focus:ring-2 focus:ring-[#fbbf24] focus:border-[#fbbf24] outline-none transition-all resize-none font-kid font-medium leading-relaxed"
                  />
                  {/* Voice input button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onMouseDown={startVoiceInput}
                    onMouseUp={stopVoiceInput}
                    onTouchStart={startVoiceInput}
                    onTouchEnd={stopVoiceInput}
                    className={`absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      recording ? "bg-red-500 animate-pulse" : "bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${recording ? "text-white" : "text-[#908fa0]"}`}
                      style={recording ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      {recording ? "stop" : "mic"}
                    </span>
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submit}
                  disabled={!selected || loading}
                  className="w-full h-16 bg-[#fbbf24] disabled:opacity-50 text-[#2a1700] font-kid font-black text-xl rounded-full shadow-[0_8px_0_#ca8100] hover:shadow-[0_4px_0_#ca8100] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-[#2a1700]/30 border-t-[#2a1700]" />
                      Zap is thinking...
                    </>
                  ) : (
                    <>Tell Zap <span className="material-symbols-outlined font-bold">arrow_forward</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* ── Zap's calming response ── */
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{FEELINGS.find(f => f.label === selected)?.emoji || "⚡"}</span>
                <h1 className="text-xl font-kid font-black text-[#e4e1e9]">
                  Zap heard you{profile.name ? `, ${profile.name}` : ""} ⚡
                </h1>
              </div>

              {zapSpeaking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-5 py-3 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-2xl">
                  <div className="flex gap-1 items-end h-5">
                    {[1,2,3,4,3].map((h, i) => (
                      <motion.div key={i} animate={{ height: [`${h*4}px`, `${h*8}px`, `${h*4}px`] }}
                        transition={{ repeat: Infinity, duration: 0.4 + i * 0.1, delay: i * 0.08 }}
                        className="w-1.5 bg-[#fbbf24] rounded-full" style={{ minHeight: "4px" }} />
                    ))}
                  </div>
                  <span className="text-[#fbbf24] font-kid font-bold text-sm">Zap is speaking to you...</span>
                </motion.div>
              )}

              {/* Main validation — biggest, most prominent */}
              <div className="p-5 rounded-3xl border-l-4 border-[#fbbf24] bg-[#fbbf24]/8" style={{ background: "rgba(251,191,36,0.06)" }}>
                <p className="text-[10px] font-kid font-bold uppercase tracking-widest text-[#908fa0] mb-2">Zap says</p>
                <p className="font-kid font-bold text-[#e4e1e9] text-lg leading-relaxed">{result.validation}</p>
              </div>

              {/* Reframe */}
              <div className="p-4 rounded-2xl border-l-4 border-indigo-400" style={{ background: "rgba(99,102,241,0.06)" }}>
                <p className="text-[10px] font-kid font-bold uppercase tracking-widest text-[#908fa0] mb-1.5">A new way to see it</p>
                <p className="font-kid text-[#e4e1e9] leading-relaxed">{result.reframe}</p>
              </div>

              {/* Next step */}
              <div className="p-4 rounded-2xl border-l-4 border-[#4edea3]" style={{ background: "rgba(78,222,163,0.06)" }}>
                <p className="text-[10px] font-kid font-bold uppercase tracking-widest text-[#908fa0] mb-1.5">Try this</p>
                <p className="font-kid font-bold text-[#e4e1e9] leading-relaxed">{result.next_step}</p>
              </div>

              {/* Identity statement */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(244,114,182,0.08)", borderLeft: "4px solid #f472b6" }}>
                <p className="text-[10px] font-kid font-bold uppercase tracking-widest text-[#908fa0] mb-1.5">Remember — you are...</p>
                <p className="font-kid font-bold text-pink-200 leading-relaxed">{result.identity_statement}</p>
              </div>

              {/* Replay button */}
              {result.audio_b64 && (
                <button
                  onClick={() => { if (result.audio_b64) { setZapSpeaking(true); playAudio(result.audio_b64); setTimeout(() => setZapSpeaking(false), 5000); }}}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#1f1f25] border border-[#fbbf24]/20 rounded-full font-kid font-bold text-[#fbbf24] hover:border-[#fbbf24]/50 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
                  Hear Zap again
                </button>
              )}

              <button onClick={reset}
                className="w-full h-14 bg-[#fbbf24] text-[#2a1700] font-kid font-black text-lg rounded-full shadow-[0_6px_0_#ca8100] active:translate-y-1 active:shadow-none transition-all">
                Check in again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-[#13131a]/80 backdrop-blur-md border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-3xl">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all ${
              href === "/feelings" ? "text-indigo-400 border-t-2 border-indigo-500 -mt-px" : "text-slate-500 hover:text-indigo-300"
            }`}>
            <span className="material-symbols-outlined" style={href === "/feelings" ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-kid text-[10px] font-medium tracking-wide">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
