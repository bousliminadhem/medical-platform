"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, HeartPulse, LogOut, Settings } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen font-sans">
      <aside className="sticky top-0 z-30 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-[#F8F9FA] text-zinc-800 shadow-sm dark:border-white/[0.08] dark:bg-obsidian-900 dark:text-zinc-100 dark:shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 px-5 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"><HeartPulse className="h-4 w-4" /></div>
            <div><span className="block text-xs font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Aether Clinic</span><span className="block font-mono text-[9px] uppercase tracking-wider text-zinc-500">Assistant Workspace</span></div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />ONLINE</div>
        </div>
        <div className="px-5 pb-2 pt-6"><span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Clinical Operations</span></div>
        <nav className="flex-1 space-y-1 px-3">
          <Link href="/assistant/agenda" className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition", pathname === "/assistant/agenda" ? "border border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-white" : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-white/[0.04]")}><CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Agenda</Link>
        </nav>
        <div className="border-t border-zinc-200/80 bg-zinc-100/60 p-3.5 dark:border-white/[0.08] dark:bg-obsidian-950/60"><div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-subtle dark:border-white/[0.06] dark:bg-obsidian-850"><div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 font-mono text-xs font-bold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400">{user?.email?.charAt(0).toUpperCase() ?? "A"}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-200">{user?.email ?? "Assistant"}</p><p className="font-mono text-[9px] uppercase tracking-wider text-sky-600 dark:text-sky-400">Medical Assistant</p></div><Link href="/assistant/settings" title="Account settings" className="rounded-lg p-1.5 text-zinc-400 hover:text-sky-600"><Settings className="h-4 w-4" /></Link><button onClick={logout} className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><LogOut className="h-4 w-4" /></button></div></div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden"><header className="flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-8 backdrop-blur-xl dark:border-white/[0.08] dark:bg-obsidian-900/70"><div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500">Clinical Workspace / <span className="font-semibold text-zinc-900 dark:text-zinc-100">Agenda</span></div><div className="flex items-center gap-3.5"><div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-1.5 font-mono text-[11px] text-zinc-600 shadow-sm dark:border-white/[0.08] dark:bg-obsidian-850/80 dark:text-zinc-400"><Calendar className="h-3.5 w-3.5 text-emerald-500" /><span>{currentDate}</span></div><ThemeToggle /></div></header><main className="flex-1 overflow-y-auto bg-[#F8F9FB] p-8 transition-colors dark:bg-obsidian-950">{children}</main></div>
    </div>
  );
}
