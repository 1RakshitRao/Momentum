"use client";
import { useState, useEffect } from "react";
import { getParentInsights, getStrengths } from "@/lib/api";
import type { ParentInsights } from "@/lib/api";
import { ParentNav } from "@/components/ParentNav";
import { motion } from "framer-motion";

export default function InsightsPage() {
  const [insights, setInsights] = useState<ParentInsights | null>(null);
  const [strengths, setStrengths] = useState<{ name: string; evidence: string; affirmation: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getParentInsights(), getStrengths()]).then(([i, s]) => {
      if (i) setInsights(i);
      if (s?.strengths) setStrengths(s.strengths.slice(0, 2));
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-[#0a0a0f] text-on-surface font-body min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#35343a] flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
          </div>
          <span className="text-indigo-500 font-headline italic text-2xl tracking-tight">Momentum</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10">
          <span className="material-symbols-outlined text-slate-500">settings</span>
        </button>
      </header>

      <main className="pt-20 pb-28 px-6 md:px-12 max-w-5xl mx-auto min-h-screen md:ml-64">
        <h1 className="font-headline text-5xl text-on-surface mb-8">Insights</h1>

        {/* Weekly summary */}
        <section className="mb-12">
          {loading ? (
            <div className="h-32 bg-[#1f1f25] rounded-2xl animate-pulse" />
          ) : (
            <p className="font-headline text-2xl md:text-3xl text-on-surface-variant leading-relaxed opacity-90">
              {insights?.summary || "No insights available yet. Check back after your child uses the app more!"}
            </p>
          )}
        </section>

        {/* Alert */}
        {insights?.alerts?.[0] && (
          <div className="mb-10 bg-[#13131a] border-l-4 border-amber-500 p-5 rounded-r-xl flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
            <div>
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider mb-1">Attention Required</h4>
              <p className="text-on-surface-variant">{insights.alerts[0]}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wins digest */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline">Wins Digest</h3>
            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#1f1f25] rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="relative pl-6 border-l border-white/5 space-y-8">
                {(insights?.wins_digest ? [insights.wins_digest] : ["No wins yet — keep using the app!"]).map((w, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="relative">
                    <div className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full bg-[#4edea3] shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ opacity: 1 - i * 0.3 }} />
                    <p className="text-on-surface font-body text-sm">{w}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Strength observations */}
          <div className="lg:col-span-2">
            <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-6">Strength Observations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-40 bg-[#1f1f25] rounded-2xl animate-pulse" />)
              ) : strengths.length > 0 ? strengths.map((s, i) => (
                <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-[#1b1b20] p-6 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-headline italic">{s.name}</h4>
                    <div className="h-6 w-16 flex items-end gap-0.5">
                      {[2, 4, 6, 3, 5].map((h, j) => (
                        <div key={j} className="w-2 rounded-full bg-indigo-500" style={{ height: `${h * 4}px`, opacity: 0.3 + j * 0.15 }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{s.evidence}</p>
                </motion.div>
              )) : (
                <div className="col-span-2 text-center py-8 text-on-surface-variant">Complete more activities to unlock strength observations.</div>
              )}
            </div>

            {/* Conversation prompts */}
            <div className="mt-10">
              <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-6">Say this today</h3>
              <div className="space-y-4">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="h-20 bg-[#1f1f25] rounded-2xl animate-pulse" />)
                ) : (insights?.conversation_prompts?.length ? insights.conversation_prompts : [
                  "I noticed you kept trying. That shows real persistence.",
                  "You handled that really well today.",
                ]).map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl border border-white/5 flex items-center gap-5 hover:bg-[#2a292f] transition-colors"
                    style={{ background: "rgba(31,31,37,0.4)", backdropFilter: "blur(12px)" }}>
                    <span className="material-symbols-outlined text-indigo-400">chat_bubble</span>
                    <p className="text-on-surface italic font-headline text-lg">"{p}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Teacher note */}
        {insights?.teacher_note && (
          <div className="mt-12">
            <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-4">Suggested Teacher Note</h3>
            <div className="p-6 rounded-3xl bg-[#0e0e13] border border-[#464554]/30 font-mono text-sm leading-relaxed text-indigo-300/90">
              {insights.teacher_note}
            </div>
          </div>
        )}
      </main>

      <ParentNav />
    </div>
  );
}
