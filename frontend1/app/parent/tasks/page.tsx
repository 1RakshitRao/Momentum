"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { captureTask, completeTask as apiComplete, postponeTask, deleteTask, transcribeAudio } from "@/lib/api";
import { ParentNav } from "@/components/ParentNav";
import type { Task } from "@/lib/api";

const urgencyBorder = { high: "border-l-red-400/80", medium: "border-l-[#ffb95f]/60", low: "border-l-[#4edea3]/40" };
const urgencyTime = { high: "text-red-400", medium: "text-on-surface-variant", low: "text-on-surface-variant" };

function TaskRow({ task, onComplete, onPostpone, onDelete }: {
  task: Task; onComplete: () => void; onPostpone: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const done = task.status === "completed";
  return (
    <motion.div layout className={`bg-[#1b1b20] rounded-xl overflow-hidden border-l-4 ${urgencyBorder[task.urgency]} transition-all hover:bg-[#1f1f25] ${done ? "opacity-50" : ""}`}>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xl">{done ? "✅" : task.urgency === "high" ? "📧" : task.urgency === "medium" ? "🧺" : "🌱"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-body font-bold text-on-surface ${done ? "line-through" : ""}`}>{task.task_name}</h3>
              {task.postpone_count > 1 && (
                <span className="bg-[#ca8100]/30 text-[#ffb95f] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Overdue</span>
              )}
            </div>
            {task.first_step && <p className="text-xs text-on-surface-variant mt-1 truncate">First step: {task.first_step}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`font-mono text-sm ${urgencyTime[task.urgency]}`}>{task.estimated_minutes}:00</span>
          {task.postpone_count > 0 && <span className="text-[10px] text-outline mt-1">Skipped {task.postpone_count}x</span>}
        </div>
      </div>
      {!done && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onComplete} className="flex-1 bg-[#00a572]/20 text-[#4edea3] py-2 rounded-lg font-label text-xs hover:bg-[#00a572]/40 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span> Mark Complete
          </button>
          <button onClick={() => setOpen(v => !v)} className="px-3 bg-[#35343a] text-on-surface-variant py-2 rounded-lg text-xs hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-sm">more_horiz</span>
          </button>
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={onPostpone} className="flex-1 bg-[#ca8100]/10 text-[#ffb95f] py-2 rounded-lg font-label text-xs">Later</button>
              <button onClick={onDelete} className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-lg font-label text-xs">Delete</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ParentTasksPage() {
  const { tasks, addTask, completeTask, removeTask, refreshTasks, tasksLoading } = useApp();
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const active = tasks.filter(t => t.status !== "completed");
  const done = tasks.filter(t => t.status === "completed");
  const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const text = await transcribeAudio(blob);
        if (text) {
          const task = await captureTask(text);
          if (task) addTask(task);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {}
  }
  function stopRec() { mediaRef.current?.stop(); setRecording(false); }

  async function handleComplete(id: number) { await apiComplete(id); completeTask(id); }
  async function handlePostpone(id: number) { await postponeTask(id); refreshTasks(); }
  async function handleDelete(id: number) { await deleteTask(id); removeTask(id); }

  return (
    <div className="bg-[#0a0a0f] text-on-surface font-body min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1f1f25] border border-white/5" />
          <span className="font-headline italic text-2xl text-indigo-500 tracking-tight">Momentum</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10">
          <span className="material-symbols-outlined text-slate-400">settings</span>
        </button>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto md:ml-64">
        <div className="mb-8">
          <h1 className="font-headline text-5xl text-on-surface mb-2">Tasks</h1>
          <p className="text-on-surface-variant font-body text-sm">Managing focus for {tasks.length} tasks.</p>
        </div>

        {/* Add task */}
        <div
          className="w-full bg-[#2a292f] border border-white/5 p-4 rounded-xl mb-10 flex items-center justify-between hover:bg-[#35343a] transition-all group cursor-pointer"
          onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full ${recording ? "bg-red-500 animate-pulse" : "bg-[#c0c1ff]/20"} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-[#c0c1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>{recording ? "stop" : "mic"}</span>
            </div>
            <span className="font-label text-on-surface text-lg">{recording ? "Listening... release to add" : "Hold to add a new focus task"}</span>
          </div>
          <span className="font-mono text-[10px] text-outline px-2 py-1 border border-outline/20 rounded uppercase tracking-widest group-hover:border-[#c0c1ff]/40">MIC</span>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Queue ({active.length})</span>
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Est. Time</span>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {tasksLoading ? (
            [1,2,3].map(i => <div key={i} className="h-20 bg-[#1f1f25] rounded-xl animate-pulse" />)
          ) : active.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-3">🎉</span>
              <p className="text-on-surface-variant">All tasks complete! Add more with the mic button.</p>
            </div>
          ) : (
            active.map(task => (
              <TaskRow key={task.id} task={task}
                onComplete={() => handleComplete(task.id)}
                onPostpone={() => handlePostpone(task.id)}
                onDelete={() => handleDelete(task.id)} />
            ))
          )}
        </div>

        {/* Productivity bento */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="bg-[#1b1b20] p-5 rounded-2xl flex flex-col justify-between aspect-square border border-white/5">
            <span className="material-symbols-outlined text-[#4edea3] text-3xl">bolt</span>
            <div>
              <span className="block font-mono text-4xl font-bold text-on-surface">{completionRate}%</span>
              <span className="font-label text-[10px] text-outline uppercase tracking-wider">Completion Rate</span>
            </div>
          </div>
          <div className="bg-[#13131a] p-5 rounded-2xl flex flex-col justify-between aspect-square relative overflow-hidden group border border-white/5">
            <span className="material-symbols-outlined text-[#c0c1ff] text-3xl z-10">psychology</span>
            <div className="z-10">
              <span className="block font-mono text-4xl font-bold text-on-surface">{done.length}</span>
              <span className="font-label text-[10px] text-outline uppercase tracking-wider">Focus Wins</span>
            </div>
          </div>
        </div>
      </main>

      {/* Voice FAB mobile */}
      <button
        onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 md:hidden ${recording ? "bg-red-500" : "bg-indigo-600"}`}>
        <span className="material-symbols-outlined font-bold text-white" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
      </button>

      <ParentNav />
    </div>
  );
}
