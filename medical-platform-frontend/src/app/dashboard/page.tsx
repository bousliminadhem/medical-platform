"use client";

import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Activity,
  ShieldCheck,
  Calendar,
  Users,
  Clock,
  ArrowUpRight,
  Terminal,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="relative min-h-screen bg-obsidian-950 font-sans text-zinc-100">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-brand/10 blur-[130px]" />
      </div>

      {/* Top Header */}
      <header className="relative flex h-16 items-center justify-between border-b border-white/[0.08] bg-obsidian-900/60 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 shadow-glow-sm">
            <Activity className="h-4 w-4 text-brand" strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-white">
              AETHER // HEALTH
            </span>
            <span className="ml-2 font-mono text-[10px] text-zinc-500 uppercase">
              Clinical Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-obsidian-850 px-3 py-1 font-mono text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-zinc-400">{user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="btn-secondary py-1.5 text-xs"
            title="Terminate Session"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-5xl px-8 py-12 space-y-8">
        {/* Welcome Banner */}
        <div className="card relative overflow-hidden border-white/[0.1] bg-gradient-to-br from-obsidian-900/90 via-obsidian-900/60 to-brand/5 p-8 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Session Initialized
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Clinical Command Center
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Connected to Aether core services. Clearances verified for:{" "}
                <span className="font-mono text-brand font-semibold">
                  {user?.roles?.join(", ") ?? "AUTHENTICATED"}
                </span>
              </p>
            </div>

            {isAdmin && (
              <Link href="/admin/staff" className="btn-primary">
                <span>Access Admin Console</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5 border-white/[0.08]">
            <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px] uppercase">
              <span>Security Clearance</span>
              <ShieldCheck className="h-4 w-4 text-brand" />
            </div>
            <p className="mt-3 text-lg font-bold text-white font-mono">
              E2EE ENCRYPTED
            </p>
            <span className="mt-1 block text-xs text-zinc-400 font-mono">
              OIDC Bearer • HS256 Token
            </span>
          </div>

          <div className="card p-5 border-white/[0.08]">
            <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px] uppercase">
              <span>Timezone Sync</span>
              <Clock className="h-4 w-4 text-brand" />
            </div>
            <p className="mt-3 text-lg font-bold text-white font-mono">
              UTC SYNCHRONIZED
            </p>
            <span className="mt-1 block text-xs text-zinc-400 font-mono">
              Zero skew detected
            </span>
          </div>

          <div className="card p-5 border-white/[0.08]">
            <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px] uppercase">
              <span>System Protocol</span>
              <Terminal className="h-4 w-4 text-brand" />
            </div>
            <p className="mt-3 text-lg font-bold text-brand font-mono">
              OPERATIONAL
            </p>
            <span className="mt-1 block text-xs text-zinc-400 font-mono">
              Spring Boot Core v3.x
            </span>
          </div>
        </div>

        {/* Quick Modules */}
        <div className="space-y-3">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Available Modules
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card p-6 border-white/[0.08] hover:border-white/[0.16] transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 mb-4">
                <Users className="h-5 w-5 text-brand" />
              </div>
              <h3 className="font-semibold text-white text-sm">
                Staff & Practitioner Registry
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Review credentialed personnel, operational duty states, and weekly shift schedules.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/staff"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-brand hover:underline"
                >
                  Open Registry →
                </Link>
              </div>
            </div>

            <div className="card p-6 border-white/[0.08] hover:border-white/[0.16] transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-obsidian-850 mb-4">
                <Calendar className="h-5 w-5 text-zinc-300" />
              </div>
              <h3 className="font-semibold text-white text-sm">
                Clinical Schedule Matrix
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Consultation slots, break intervals, and automated appointment availability mapping.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/staff"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Manage Availability →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
