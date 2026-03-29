"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { completeTask as apiComplete, postponeTask, deleteTask } from "@/lib/api";
import type { Task } from "@/lib/api";

const NAV = [
  { href: "/now", icon: "dashboard", label: "Now" },
  { href: "/quests", icon: "school", label: "Quests" },
  { href: "/feelings", icon: "mood", label: "Feelings" },
  { href: "/wins", icon: "emoji_events", label: "Wins" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

const urgencyBorder = { high: "border-l-red-400/60", medium: "border-l-[#fbbf24]/50", low: "border-l-green-400/40" };
const urgencyColor = { high: "text-red-400", medium: "text-[#fbbf24]", low: "text-green-400" };

function QuestCard({ task, onComplete, onPostpone, onDelete, onStart }: {
  task: Task; onComplete: () => void; onPostpone: () => void; onDelete: () => void; onStart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const done = task.status === "completed";
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: done ? 0.5 : 1, y: 0 }}
      className={`bg-[#1b1b20] rounded-2xl border-l-4 ${urgencyBorder[task.urgency]} overflow-hidden`}>
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl mt-0.5">
            {done ? "✅" : task.urgency === "high" ? "🔥" : task.urgency === "medium" ? "⚡" : "🌱"}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className={`font-kid font-bold text-base ${done ? "line-through text-outline" : "text-on-surface"}`}>
              {task.quest_title || task.task_name}
            </h3>
            {task.first_step && !done && (
              <p className="text-xs text-on-surface-variant mt-0.5 font-kid">Next: {task.first_step}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`font-mono text-sm ${urgencyColor[task.urgency]}`}>{task.estimated_minutes}m</span>
          {task.postpone_count > 0 && <span className="text-[10px] text-outline">Skipped {task.postpone_count}x</span>}
        </div>
      </div>
      {!done && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onStart} className="flex-1 bg-[#fbbf24]/20 text-[#fbbf24] py-2 rounded-xl font-kid font-bold text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">play_arrow</span> Start
          </button>
          <button onClick={onComplete} className="flex-1 bg-[#4edea3]/10 text-[#4edea3] py-2 rounded-xl font-kid font-bold text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> Done
          </button>
          <button onClick={() => setOpen(v => !v)} className="px-3 bg-[#35343a] py-2 rounded-xl">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">more_horiz</span>
          </button>
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={onPostpone} className="flex-1 bg-[#ffb95f]/10 text-[#ffb95f] py-2 rounded-xl font-kid font-bold text-xs">Later</button>
              <button onClick={onDelete} className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-xl font-kid font-bold text-xs">Delete</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function QuestsPage() {
  const router = useRouter();
  const { tasks, completeTask, removeTask, refreshTasks, setActiveTask } = useApp();
  const [tab, setTab] = useState<"active" | "done">("active");

  const active = tasks.filter(t => t.status !== "completed");
  const done = tasks.filter(t => t.status === "completed");
  const show = tab === "active" ? active : done;

  async function handleComplete(id: number) { await apiComplete(id); completeTask(id); }
  async function handlePostpone(id: number) { await postponeTask(id); refreshTasks(); }
  async function handleDelete(id: number) { await deleteTask(id); removeTask(id); }
  function handleStart(task: Task) { setActiveTask(task); router.push("/guidance"); }

  return (
    <div className="bg-[#0f0e1a] text-on-surface font-kid min-h-screen pb-24">
      <div className="fixed inset-0 star-field opacity-20 pointer-events-none" />
      <div className="fixed inset-0 -z-20" style={{ background: "linear-gradient(180deg, #0f0e1a 0%, #2d1b4d 50%, #4a2b82 100%)" }} />

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-10">
        <h1 className="font-kid font-black text-4xl text-on-surface mb-1">Your Quests 🗺️</h1>
        <p className="text-outline font-kid text-sm mb-6">{active.length} active · {done.length} completed</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["active", "done"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-2xl font-kid font-bold text-sm transition-all ${
                tab === t ? "bg-[#fbbf24] text-amber-950 shadow-[0_4px_0_#d97706]" : "bg-[#1f1f25] text-on-surface-variant"
              }`}>
              {t === "active" ? "⚡ Active" : "✅ Done"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {show.length === 0 ? (
            <div className="rounded-3xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-5xl block mb-3">{tab === "active" ? "🎉" : "📭"}</span>
              <p className="font-kid font-bold text-on-surface-variant">
                {tab === "active" ? "No active quests! Go add one." : "No completed quests yet."}
              </p>
            </div>
          ) : (
            show.map((task) => (
              <QuestCard key={task.id} task={task}
                onComplete={() => handleComplete(task.id)}
                onPostpone={() => handlePostpone(task.id)}
                onDelete={() => handleDelete(task.id)}
                onStart={() => handleStart(task)} />
            ))
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 h-24 bg-[#13131a]/80 backdrop-blur-xl border-t border-white/5 rounded-t-[40px]">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-all ${href === "/quests" ? "text-[#fbbf24] border-t-4 border-[#fbbf24] -mt-px" : "text-slate-500 hover:text-indigo-300"}`}>
            <span className="material-symbols-outlined text-3xl" style={href === "/quests" ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="font-kid font-black text-[10px] tracking-widest uppercase">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
