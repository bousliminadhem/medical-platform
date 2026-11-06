"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Users,
  Activity,
  HeartPulse,
  Calendar,
  ClipboardList,
  CalendarDays,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/admin/staff", label: "Medical Staff", icon: Users, badge: "Directory" },
  { href: "/admin/patients", label: "Patients", icon: Users, badge: "Directory" },
  { href: "/admin/audit", label: "Audit Trail", icon: ClipboardList, badge: "Security" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen font-sans">
      {/* Soft Off-White Sidebar (Light Mode) / Obsidian Sidebar (Dark Mode) */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-[#F8F9FA] text-zinc-800 dark:border-white/[0.08] dark:bg-obsidian-900 dark:text-zinc-100 shadow-sm dark:shadow-2xl z-30 transition-colors">
        {/* Clinic Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.08] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/10 dark:border-emerald-500/30 dark:text-emerald-400 shadow-sm">
              <HeartPulse className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div>
              <span className="block text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
                Aether Clinic
              </span>
              <span className="block font-mono text-[9px] tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Clinical Administration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            ONLINE
          </div>
        </div>

        {/* Section label */}
        <div className="px-5 pt-6 pb-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Practice Management
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 shadow-soft dark:bg-gradient-to-r dark:from-emerald-500/15 dark:to-transparent dark:text-white dark:border-emerald-500/30"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    )}
                  />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span
                    className={clsx(
                      "font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                      isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                        : "bg-zinc-200/80 text-zinc-600 dark:bg-obsidian-800 dark:text-zinc-400"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Administrator Profile Card */}
        <div className="border-t border-zinc-200/80 dark:border-white/[0.08] p-3.5 bg-zinc-100/60 dark:bg-obsidian-950/60">
          <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-obsidian-850 p-2.5 border border-zinc-200/80 dark:border-white/[0.06] shadow-subtle">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {user?.email?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                {user?.email ?? "Administrator"}
              </p>
              <p className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate font-semibold">
                Clinical Director
              </p>
            </div>
            <Link href="/admin/settings" title="Account settings" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-emerald-600 dark:hover:bg-white/[0.06] dark:hover:text-brand"><Settings className="h-4 w-4" /></Link>
            <button
              onClick={logout}
              title="Sign out of clinic console"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Clinical Utility Bar */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/80 dark:border-white/[0.08] dark:bg-obsidian-900/70 px-8 backdrop-blur-xl transition-colors z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono uppercase tracking-wider">Clinical Workspace /</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
              {pathname.startsWith("/admin/patients")
                ? "Patient Directory"
                : pathname.startsWith("/admin/agenda")
                  ? "Clinical Agenda"
                : pathname.startsWith("/admin/audit")
                  ? "Audit Trail"
                  : "Medical Staff Directory"}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Live Date display */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/90 dark:bg-obsidian-850/80 px-3 py-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <span>{currentDate}</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Main Body (Soft off-white canvas in light mode, deep obsidian in dark mode) */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8F9FB] dark:bg-obsidian-950 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
