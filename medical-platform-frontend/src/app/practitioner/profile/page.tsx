"use client";

import { useEffect, useState } from "react";
import { Award, CalendarClock, Mail, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getWorkingHours, listPractitioners } from "@/services/practitioner.service";
import type { PractitionerResponse, WorkingHoursResponse } from "@/types/api";

export default function PractitionerProfilePage() {
  const { user, isPractitioner, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PractitionerResponse | null>(null);
  const [hours, setHours] = useState<WorkingHoursResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPractitioner || !user) return;
    Promise.all([listPractitioners(false), getWorkingHours(user.id)])
      .then(([profiles, schedule]) => {
        setProfile(profiles.find((item) => item.id === user.id) ?? null);
        setHours(schedule);
      })
      .finally(() => setLoading(false));
  }, [isPractitioner, user]);

  if (authLoading || loading) return <div className="p-10 text-center text-sm text-zinc-500"><RefreshCw className="mx-auto h-5 w-5 animate-spin text-brand" /><p className="mt-3">Loading practitioner dossier…</p></div>;
  if (!isPractitioner || !profile) return <div className="card p-10 text-center text-sm text-red-600">Practitioner profile unavailable.</div>;
  const email = user?.email ?? "Not specified";

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 dark:text-brand">Identity dossier</span><h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">My Practitioner Profile</h1><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Your clinical identity, accreditation, and availability at a glance.</p></div>
    <div className="card border-zinc-200 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900/95">
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center dark:border-white/[0.08]"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-xl font-bold text-emerald-700 dark:border-brand/40 dark:bg-brand/10 dark:text-brand">{profile.firstName[0]}{profile.lastName[0]}</div><div><h2 className="text-xl font-bold text-zinc-900 dark:text-white">Dr. {profile.firstName} {profile.lastName}</h2><p className="mt-1 font-mono text-xs uppercase tracking-wider text-emerald-700 dark:text-brand">{profile.specialty || "General Practice"}</p><span className="badge-active mt-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{profile.active ? "Active Duty" : "Disabled"}</span></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Practitioner ID" value={profile.id} icon={<ShieldCheck className="h-3.5 w-3.5 text-purple-500" />} /><Info label="Medical license" value={profile.licenseNumber} icon={<Award className="h-3.5 w-3.5 text-amber-500" />} /><Info label="Email" value={email} icon={<Mail className="h-3.5 w-3.5 text-emerald-500" />} /><Info label="Phone" value="Managed through staff administration" icon={<Phone className="h-3.5 w-3.5 text-sky-500" />} /></div>
    </div>
    <div className="card overflow-hidden border-zinc-200 bg-white p-0 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-white/[0.08]"><CalendarClock className="h-4 w-4 text-emerald-600 dark:text-brand" /><div><h2 className="text-sm font-bold text-zinc-900 dark:text-white">Weekly Availability</h2><p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Configured shift matrix</p></div></div>
      {hours.length ? <div className="overflow-x-auto"><div className="min-w-[620px]">
        <div className="grid grid-cols-[1fr_1.4fr_1fr] items-center border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-white/[0.08] dark:bg-obsidian-850/50">
          <span>Day</span><span>Working hours</span><span>Appointment slots</span>
        </div>
        <div className="divide-y divide-zinc-200/70 dark:divide-white/[0.04]">
          {hours.map((entry) => <div key={entry.dayOfWeek} className="grid grid-cols-[1fr_1.4fr_1fr] items-center px-5 py-4 text-center text-xs transition hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.dayOfWeek}</span>
            <span className="justify-self-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-xs text-emerald-800 dark:border-brand/20 dark:bg-brand/5 dark:text-brand">{entry.startTime.slice(0, 5)} – {entry.endTime.slice(0, 5)}</span>
            <span className="justify-self-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-600 dark:border-white/[0.06] dark:bg-obsidian-850 dark:text-zinc-400">{entry.slotMinutes} min</span>
          </div>)}
        </div>
      </div></div> : <p className="p-6 text-center text-xs text-zinc-500">No working hours configured.</p>}
    </div>
  </div>;
}

function Info({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-white/[0.06] dark:bg-obsidian-850/60"><div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{icon}{label}</div><p className="mt-1.5 break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">{value || "Not specified"}</p></div>;
}
