"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getParentInsights } from "@/lib/api";
import { ParentNav } from "@/components/ParentNav";
import { useApp } from "@/lib/context";

const ACCOMMODATIONS = [
  {
    icon: "center_focus_weak", title: "Focus Support", color: "bg-indigo-500/10 text-indigo-400",
    tips: ["Preferential seating away from high-traffic areas.", "Use of noise-canceling headphones during quiet work."],
    tipColor: "text-indigo-500"
  },
  {
    icon: "sync_alt", title: "Transitions", color: "bg-[#4edea3]/10 text-[#4edea3]",
    tips: ["5-minute visual warnings before changing tasks.", "Step-by-step checklist for end-of-day packing."],
    tipColor: "text-[#4edea3]"
  },
  {
    icon: "history_edu", title: "Working Memory", color: "bg-[#ffb95f]/10 text-[#ffb95f]",
    tips: ["Provide written copies of oral instructions.", "Break multi-step projects into smaller 'chunks.'"],
    tipColor: "text-[#ffb95f]"
  },
];

const LANGUAGE = [
  {
    avoid: '"Why aren\'t you focusing?"', why_avoid: "Implies intentional defiance.",
    use: '"What is getting in your way right now?"', why_use: "Identifies external barriers to executive function.",
  },
  {
    avoid: '"You\'re just being lazy."', why_avoid: "Moralizes a biological difficulty.",
    use: '"I see you\'re struggling to start. Let\'s do step one together."', why_use: "Validates and offers low-friction entry.",
  },
  {
    avoid: '"I\'ve told you three times."', why_avoid: "Highlights memory failure as a personal flaw.",
    use: '"Let me write that down so your brain can take a break."', why_use: "Provides a practical scaffold.",
  },
];

export default function TeacherPage() {
  const { profile } = useApp();
  const [teacherNote, setTeacherNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getParentInsights().then((i) => {
      if (i?.teacher_note) setTeacherNote(i.teacher_note);
      setLoading(false);
    });
  }, []);

  function copyNote() {
    if (teacherNote) {
      navigator.clipboard.writeText(teacherNote).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  }

  const childName = profile.name || "the child";

  return (
    <div className="bg-[#0a0a0f] text-on-surface font-body min-h-screen pb-24">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0a0a0f] border-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1f1f25] border border-[#464554]/20">
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </div>
          <span className="font-headline italic text-2xl text-indigo-500 tracking-tight">Momentum</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10">
          <span className="material-symbols-outlined text-slate-500">settings</span>
        </button>
      </header>

      <main className="pt-24 px-6 max-w-6xl mx-auto md:ml-64">
        {/* Hero */}
        <section className="mb-12">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface mb-2">Teacher Suite</h1>
          <p className="text-on-surface-variant max-w-xl font-body">Bridge the gap between home and classroom with empathetic, neuro-inclusive communication tools.</p>
        </section>

        {/* Accommodation strategies */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#c0c1ff]">psychology</span>
            <h2 className="text-xl font-label font-bold tracking-tight">Accommodation Strategies</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACCOMMODATIONS.map(({ icon, title, color, tips, tipColor }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-[#1b1b20] border border-white/5 group hover:border-[#c0c1ff]/30 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-6`}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <h3 className="text-xl font-headline italic mb-3">{title}</h3>
                <ul className="space-y-3 text-sm text-on-surface-variant">
                  {tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-xs mt-1 ${tipColor}`}>circle</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Teacher note */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c0c1ff]">auto_awesome</span>
              <h2 className="text-xl font-label font-bold tracking-tight">AI Generated Teacher Note</h2>
            </div>
            <button onClick={() => { setLoading(true); getParentInsights().then(i => { if (i?.teacher_note) setTeacherNote(i.teacher_note); setLoading(false); }); }}
              className="text-xs font-label uppercase tracking-widest text-[#c0c1ff] hover:text-[#8083ff] transition-colors">
              Regenerate
            </button>
          </div>
          <div className="relative group">
            <div className="p-8 rounded-3xl bg-[#0e0e13] border border-[#464554]/30 font-mono text-sm leading-relaxed text-indigo-300/90 shadow-2xl">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-4 bg-[#1f1f25] rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />)}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {teacherNote || `DEAR TEACHER,\n\nI AM WRITING TO SHARE RECENT OBSERVATIONS ABOUT ${childName.toUpperCase()}'S LEARNING PATTERNS. THEY RESPOND PARTICULARLY WELL TO VISUAL ANCHORS AND STEP-BY-STEP GUIDANCE.\n\nTO SUPPORT THEIR EXECUTIVE FUNCTIONING, BRIEF TRANSITION WARNINGS AND WRITTEN INSTRUCTIONS HAVE SHOWN POSITIVE RESULTS AT HOME.\n\nTHANK YOU FOR YOUR PARTNERSHIP.`}
                </pre>
              )}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={copyNote}
                  className="bg-[#c0c1ff] text-[#07006c] px-4 py-2 rounded-xl flex items-center gap-2 font-label text-xs font-bold active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  {copied ? "COPIED!" : "COPY NOTE"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 px-2">
              <div className="h-1 w-1/3 bg-[#c0c1ff] rounded-full" />
              <span className="text-[10px] font-mono text-outline uppercase tracking-widest">Neuro-Inclusive Framework</span>
            </div>
          </div>
        </section>

        {/* Shame-free language guide */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#4edea3]">forum</span>
            <h2 className="text-xl font-label font-bold tracking-tight">Shame-Free Language Guide</h2>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a292f]">
                  <th className="p-5 font-label text-sm font-bold border-b border-white/5">THE TRIGGER (AVOID)</th>
                  <th className="p-5 font-label text-sm font-bold border-b border-white/5">THE BRIDGE (ADOPT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {LANGUAGE.map(({ avoid, why_avoid, use, why_use }, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-red-900/5" : "bg-red-900/10"}>
                    <td className="p-5 align-top">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-lg">cancel</span>
                        <div>
                          <p className="text-error font-medium mb-1">{avoid}</p>
                          <p className="text-xs text-error/60 italic">{why_avoid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top bg-green-900/5">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#4edea3] text-lg">check_circle</span>
                        <div>
                          <p className="text-[#4edea3] font-medium mb-1">{use}</p>
                          <p className="text-xs text-[#4edea3]/60 italic">{why_use}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quote */}
        <section className="mt-24 mb-12 text-center max-w-2xl mx-auto">
          <p className="font-headline italic text-3xl text-on-surface-variant/40 leading-relaxed">
            "Neuro-inclusion isn't about doing less; it's about doing differently."
          </p>
        </section>
      </main>

      <ParentNav />
    </div>
  );
}
