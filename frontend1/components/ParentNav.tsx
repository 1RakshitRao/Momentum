"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/parent", icon: "dashboard", label: "Dashboard" },
  { href: "/parent/insights", icon: "analytics", label: "Insights" },
  { href: "/parent/tasks", icon: "checklist", label: "Tasks" },
  { href: "/parent/calendar", icon: "calendar_today", label: "Calendar" },
  { href: "/parent/teacher", icon: "school", label: "Teacher" },
];

export function ParentNav() {
  const path = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#0a0a0f] border-r border-white/5 p-6 z-40">
        <div className="font-headline italic text-xl text-indigo-500 mb-8">Momentum</div>
        <div className="flex items-center gap-3 p-4 mb-8 bg-[#13131a] rounded-xl border border-white/5">
          <div className="w-10 h-10 rounded-full bg-[#1f1f25] flex items-center justify-center text-indigo-400">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h4 className="text-xs font-bold font-body text-on-surface">Parent Mode</h4>
            <p className="text-[10px] text-outline uppercase tracking-widest">Executive Suite</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {items.map(({ href, icon, label }) => {
            const active = path === href || (href !== "/parent" && path.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm transition-all ${
                  active ? "bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 ml-0 pl-3" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}>
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg font-body text-sm transition-all">
              <span className="material-symbols-outlined">logout</span>
              Back to Home
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-[#13131a]/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {items.map(({ href, icon, label }) => {
          const active = path === href || (href !== "/parent" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 transition-all ${
                active ? "text-indigo-400 border-t-2 border-indigo-500 -mt-px" : "text-slate-500 hover:text-indigo-300"
              }`}>
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
              <span className="font-body text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
