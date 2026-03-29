"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchMomentum, getParentInsights, fetchCalendar } from "@/lib/api";
import type { MomentumStats, ParentInsights, CalendarEvent } from "@/lib/api";
import { useApp } from "@/lib/context";
import { ParentNav } from "@/components/ParentNav";

export default function ParentDashboard() {
  const { profile } = useApp();
  const [stats, setStats] = useState<MomentumStats | null>(null);
  const [insights, setInsights] = useState<ParentInsights | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMomentum(), getParentInsights(), fetchCalendar()]).then(([m, i, e]) => {
      if (m) setStats(m);
      if (i) setInsights(i);
      if (e) setEvents(e.slice(0, 2));
      setLoading(false);
    });
  }, []);

  const childName = profile.name || "your child";

  return (
    <div className="bg-[#0a0a0f] text-on-surface font-body min-h-screen selection:bg-indigo-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1f1f25] border border-white/10 flex items-center justify-center text-indigo-400">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <h1 className="font-headline italic text-2xl tracking-tight text-indigo-500">Momentum</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10 transition-colors">
              <span className="material-symbols-outlined text-slate-400">settings</span>
            </button>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-10 md:ml-64">
        {/* Greeting */}
        <section className="space-y-2">
          <h2 className="font-headline text-4xl md:text-5xl text-on-surface leading-tight">
            {loading ? "Loading..." : <>
              Good day, Parent.<br />
              <span className="text-on-surface-variant italic opacity-80">
                {insights?.summary?.slice(0, 60) || `${childName} is making progress.`}
              </span>
            </>}
          </h2>
        </section>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Brave Starts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="md:col-span-7 lg:col-span-8 bg-[#13131a] rounded-3xl p-8 border border-white/[0.07] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-slate-500 mb-4 block">Focus Momentum</span>
                <div className="flex items-baseline gap-4">
                  <h3 className="font-mono text-6xl md:text-7xl font-bold text-indigo-500 tracking-tighter">
                    {loading ? "–" : stats?.brave_starts_this_week ?? 0}
                  </h3>
                  <div className="flex flex-col">
                    <span className="font-headline text-2xl text-on-surface italic">Brave Starts</span>
                    <div className="flex items-center gap-1 text-[#4edea3]">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                      <span className="font-mono text-xs">This week</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 h-16 w-full flex items-end gap-1">
                {(stats?.weekly_data || Array(7).fill({ starts: 0 })).map((d, i) => (
                  <div key={i} className="flex-1 bg-[#4edea3] rounded-t-sm transition-all"
                    style={{ height: `${Math.max(10, (d.starts / Math.max(...(stats?.weekly_data?.map(x => x.starts) || [1]), 1)) * 100)}%`, opacity: 0.1 + i * 0.13 }} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Insight card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="md:col-span-5 lg:col-span-4 bg-[#13131a] rounded-3xl p-8 border-2 border-indigo-500/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-8xl">psychology</span>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-label text-xs uppercase tracking-widest text-indigo-500">Live Insight</span>
              </div>
              <p className="font-headline text-2xl text-on-surface leading-snug">
                {insights?.summary || "Generating insights..."}
              </p>
              {insights?.alerts?.[0] && (
                <p className="text-sm text-on-surface-variant leading-relaxed">{insights.alerts[0]}</p>
              )}
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Tasks started", val: stats?.brave_starts_this_week ?? 0, icon: "checklist", hover: "group-hover:text-indigo-500" },
              { label: "Quests completed", val: stats?.quests_completed ?? 0, icon: "auto_awesome", hover: "group-hover:text-[#4edea3]" },
              { label: "Days active", val: stats?.streak_days ?? 0, icon: "calendar_today", hover: "group-hover:text-[#ffb95f]" },
            ].map(({ label, val, icon, hover }) => (
              <div key={label} className="bg-[#1b1b20] rounded-2xl p-6 border border-white/[0.07] hover:bg-[#35343a] transition-colors group">
                <span className="text-xs font-label text-slate-500 uppercase tracking-widest block mb-2">{label}</span>
                <div className="flex justify-between items-end">
                  <span className="font-mono text-4xl font-bold text-on-surface">{loading ? "–" : String(val).padStart(2, "0")}</span>
                  <span className={`material-symbols-outlined text-slate-600 transition-colors ${hover}`}>{icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar preview */}
          <div className="md:col-span-12">
            <div className="bg-[#13131a] rounded-3xl p-8 border border-white/[0.07]">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-label text-xs uppercase tracking-widest text-slate-500">Upcoming Agenda</h4>
                <Link href="/parent/calendar">
                  <button className="text-xs text-indigo-500 font-medium flex items-center gap-1 hover:underline">
                    View full calendar <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </Link>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {events.length > 0 ? events.map((ev) => (
                  <div key={ev.id} className="flex-1 bg-[#1b1b20] border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:bg-[#2a292f] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined">event</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-on-surface text-sm">{ev.event_name}</h5>
                        <p className="text-xs text-on-surface-variant">{new Date(ev.event_datetime).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#35343a] text-[10px] font-mono text-on-surface-variant border border-white/[0.07]">
                      {ev.prep_tasks?.length || 0} tasks
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 bg-[#1b1b20] border border-white/[0.07] rounded-2xl p-5 text-on-surface-variant text-sm text-center opacity-60">
                    No upcoming events
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Link href="/parent/insights">
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-body font-bold tracking-tight shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_graph</span>
              View weekly insights
            </button>
          </Link>
        </div>
      </main>

      {/* Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-[#4edea3]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <ParentNav />
    </div>
  );
}
