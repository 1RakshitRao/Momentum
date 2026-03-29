"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchCalendar, addCalendarEvent } from "@/lib/api";
import type { CalendarEvent } from "@/lib/api";
import { ParentNav } from "@/components/ParentNav";

export default function ParentCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCalendar().then(e => { setEvents(e); setLoading(false); });
  }, []);

  async function addEvent() {
    if (!input.trim()) return;
    setAdding(true);
    const ev = await addCalendarEvent(input);
    if (ev) setEvents(p => [ev, ...p]);
    setInput("");
    setAdding(false);
  }

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
          <h1 className="font-headline text-5xl text-on-surface mb-2">Calendar</h1>
          <p className="text-on-surface-variant font-body text-sm">Upcoming events and prep tasks.</p>
        </div>

        {/* Add event */}
        <div className="flex gap-3 mb-8">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addEvent()}
            placeholder="Add an event, e.g. 'Math test on Friday at 9am'"
            className="flex-1 bg-[#1f1f25] border border-white/5 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-indigo-500 transition-colors text-sm"
          />
          <button onClick={addEvent} disabled={adding || !input.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-label font-bold text-sm disabled:opacity-50 hover:bg-indigo-500 transition-colors">
            {adding ? "..." : "Add"}
          </button>
        </div>

        {/* Events */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-[#1f1f25] rounded-2xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📅</span>
            <p className="text-on-surface-variant">No events yet. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#13131a] rounded-2xl p-6 border border-white/[0.07]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <span className="material-symbols-outlined">event</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-body font-bold text-on-surface">{ev.event_name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">{new Date(ev.event_datetime).toLocaleString()}</p>
                    {ev.location && <p className="text-xs text-outline mt-0.5">{ev.location}</p>}
                  </div>
                </div>
                {ev.prep_tasks?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-label uppercase tracking-widest text-outline mb-2">Prep tasks</p>
                    {ev.prep_tasks.map((pt) => (
                      <div key={pt.id} className="flex items-center gap-3 bg-[#1b1b20] rounded-lg px-4 py-2">
                        <span className={`w-2 h-2 rounded-full ${pt.status === "done" ? "bg-[#4edea3]" : "bg-[#ffb95f]"}`} />
                        <span className="text-sm font-body text-on-surface-variant flex-1">{pt.action}</span>
                        <span className="text-[10px] font-mono text-outline">{pt.due_time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <ParentNav />
    </div>
  );
}
