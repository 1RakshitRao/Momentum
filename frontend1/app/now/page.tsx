"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { captureTask, transcribeAudio, whatNow, playAudio } from "@/lib/api";


const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function NowPage() {
  const router = useRouter();
  const { profile, tasks, addTask, setActiveTask } = useApp();
  const [recording, setRecording] = useState(false);
  const [zapMsg, setZapMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const pending = tasks.filter((t) => t.status !== "completed");
  const topTask = pending[0];

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const text = await transcribeAudio(blob);
        if (text) {
          const task = await captureTask(text);
          if (task) { addTask(task); setZapMsg(`Quest added! "${task.quest_title || task.task_name}" 🌟`); }
        }
        setProcessing(false);
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { setZapMsg("Mic access needed to add quests!"); }
  }

  function stopRec() { mediaRef.current?.stop(); setRecording(false); }

  async function handleStart() {
    if (!topTask) return;
    setProcessing(true);
    await whatNow().then((r) => {
      if (r?.audio_b64) playAudio(r.audio_b64);
    });
    setActiveTask(topTask);
    router.push("/guidance");
    setProcessing(false);
  }

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "transparent" }}>
      {/* Background */}
      <div className="fixed inset-0 -z-20" style={{ background: "linear-gradient(180deg, #0f0e1a 0%, #2d1b4d 50%, #4a2b82 100%)" }} />
      {/* Stars */}
      {[[10,15],[25,80],[45,10],[60,85],[15,50]].map(([top, left], i) => (
        <div key={i} className="fixed bg-white rounded-full opacity-60 pointer-events-none"
          style={{ top: `${top}%`, left: `${left}%`, width: i === 4 ? 8 : i === 1 ? 6 : 4, height: i === 4 ? 8 : i === 1 ? 6 : 4 }} />
      ))}
      {/* Hills */}
      <div className="fixed -z-10 pointer-events-none"
        style={{ bottom: 0, left: "-20%", width: "140%", height: 300, background: "#004d40", borderRadius: "100% 100% 0 0 / 20% 20% 0 0" }} />

      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-8 pb-4 z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-kid">Hey {profile.name || "Explorer"}! ⚡</h1>
        <div className="bg-amber-400 text-amber-950 font-kid font-black text-xs px-4 py-2 rounded-full shadow-[0_4px_0_#b45309] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          BRAVE STARTS THIS WEEK
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 pb-32 flex flex-col gap-8 z-10 overflow-y-auto">
        {/* Zap message */}
        {zapMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <p className="font-kid font-bold text-white text-sm">{zapMsg}</p>
          </motion.div>
        )}

        {/* Featured quest */}
        <section className="flex flex-col items-center">
          {topTask ? (
            <div className="w-full rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="material-symbols-outlined text-6xl">rocket_launch</span>
              </div>
              <span className="text-5xl mb-4">{topTask.urgency === "high" ? "🔥" : topTask.urgency === "medium" ? "⚡" : "🌱"}</span>
              <h2 className="text-2xl font-kid font-black text-white mb-1">{topTask.quest_title || topTask.task_name}</h2>
              <div className="flex items-center gap-2 text-indigo-200 mb-8 font-kid font-bold text-sm">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>about {topTask.estimated_minutes} mins</span>
              </div>
              <button
                onClick={handleStart}
                disabled={processing}
                className="w-full h-14 bg-[#fbbf24] text-[#451a03] rounded-full text-xl font-kid font-black shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-60"
              >
                {processing ? "Loading..." : "Start"}
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          ) : (
            <div className="w-full rounded-3xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-5xl block mb-3">🎉</span>
              <h2 className="font-kid font-black text-2xl text-white mb-2">All caught up!</h2>
              <p className="text-indigo-200 font-kid text-sm">Hold the mic button to add a new quest.</p>
            </div>
          )}
          <button onClick={() => router.push("/quests")} className="mt-6 text-slate-400 font-kid font-bold text-sm hover:text-slate-200 transition-colors uppercase tracking-widest">
            See all quests
          </button>
        </section>

        {/* Zap section */}
        <section className="flex-1 flex flex-col items-center justify-end pb-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-36 h-36 bg-[#fbbf24] rounded-full relative flex items-center justify-center"
              style={{ filter: "drop-shadow(0 0 28px rgba(251,191,36,0.6))" }}
            >
              {/* Cheek blush */}
              <div className="absolute w-8 h-4 rounded-full bg-[#f59e0b]/60 left-3 top-[52%]" />
              <div className="absolute w-8 h-4 rounded-full bg-[#f59e0b]/60 right-3 top-[52%]" />
              {/* Left eye */}
              <div className="absolute left-9 top-[38%] flex flex-col items-center gap-0.5">
                <div className="w-4 h-5 bg-[#451a03] rounded-full" />
                <div className="w-1.5 h-1.5 bg-white rounded-full -mt-4 ml-1 opacity-70" />
              </div>
              {/* Right eye */}
              <div className="absolute right-9 top-[38%] flex flex-col items-center gap-0.5">
                <div className="w-4 h-5 bg-[#451a03] rounded-full" />
                <div className="w-1.5 h-1.5 bg-white rounded-full -mt-4 ml-1 opacity-70" />
              </div>
              {/* Big smile — SVG arc */}
              <svg className="absolute bottom-7" width="52" height="22" viewBox="0 0 52 22" fill="none">
                <path d="M4 4 Q26 22 48 4" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none"/>
              </svg>
            </motion.div>
            <div className="absolute -bottom-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-kid font-black text-indigo-200 border border-white/20 uppercase tracking-tighter">
              {recording ? "Listening... 🎤" : "Zap is listening..."}
            </div>
          </div>
        </section>
      </main>

      {/* Voice FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onMouseDown={startRec}
        onMouseUp={stopRec}
        onTouchStart={startRec}
        onTouchEnd={stopRec}
        className={`fixed bottom-28 right-6 w-16 h-16 rounded-full flex items-center justify-center z-50 transition-all ${recording ? "bg-red-500 animate-pulse" : "bg-[#fbbf24]"} shadow-[0_10px_30px_rgba(251,191,36,0.4)]`}
      >
        <span className="material-symbols-outlined text-[#451a03] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {recording ? "stop" : "mic"}
        </span>
      </motion.button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 h-24 bg-[#13131a]/80 backdrop-blur-xl border-t border-white/5 rounded-t-[40px]">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all ${href === "/now" ? "text-[#fbbf24] border-t-4 border-[#fbbf24] -mt-px" : "text-slate-500 hover:text-indigo-300"}`}>
            <span className="material-symbols-outlined text-3xl" style={href === "/now" ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-kid font-black text-[10px] tracking-widest uppercase">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
