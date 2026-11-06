"use client";

import Link from "next/link";
import { CalendarDays, HeartPulse, LogOut, ShieldCheck, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  return <div className="flex min-h-screen font-sans">
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-[#F8F9FA] text-zinc-800 shadow-sm dark:border-white/[0.08] dark:bg-obsidian-900 dark:text-zinc-100">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200/80 px-5 dark:border-white/[0.08]"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"><HeartPulse className="h-4 w-4" /></div><div><span className="block text-xs font-bold uppercase text-zinc-900 dark:text-white">Aether Clinic</span><span className="block font-mono text-[9px] uppercase tracking-wider text-zinc-500">Patient Portal</span></div></div>
      <div className="px-5 pb-2 pt-6 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">My care</div>
      <nav className="space-y-1 px-3"><Link href="/patient/me" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${pathname === "/patient/me" ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-white" : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-white/[0.04]"}`}><ShieldCheck className="h-4 w-4" />Clinical record</Link><Link href="/patient/agenda" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${pathname === "/patient/agenda" ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-white" : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-white/[0.04]"}`}><CalendarDays className="h-4 w-4" />My appointments</Link></nav>
      <div className="mt-auto border-t border-zinc-200/80 bg-zinc-100/60 p-3.5 dark:border-white/[0.08] dark:bg-obsidian-950/60"><div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-2.5 dark:border-white/[0.06] dark:bg-obsidian-850"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">{user?.email?.charAt(0).toUpperCase() ?? "P"}</div><p className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-900 dark:text-zinc-200">{user?.email ?? "Patient"}</p><Link href="/patient/settings" title="Account settings" className="rounded-lg p-1.5 text-zinc-400 hover:text-emerald-600"><Settings className="h-4 w-4" /></Link><button onClick={logout} className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600"><LogOut className="h-4 w-4" /></button></div></div>
    </aside>
    <div className="flex flex-1 flex-col overflow-hidden"><header className="flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-8 backdrop-blur-xl dark:border-white/[0.08] dark:bg-obsidian-900/70"><span className="font-mono text-xs uppercase tracking-wider text-zinc-500">Patient Workspace / <strong className="text-zinc-900 dark:text-zinc-100">Clinical Record</strong></span><div className="flex items-center gap-3"><span className="hidden items-center gap-2 font-mono text-[10px] text-emerald-700 sm:flex dark:text-brand"><CalendarDays className="h-3.5 w-3.5" />{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date())}</span><ThemeToggle /></div></header><main className="flex-1 overflow-y-auto bg-[#F8F9FB] p-5 dark:bg-obsidian-950 sm:p-8">{children}</main></div>
  </div>;
}
