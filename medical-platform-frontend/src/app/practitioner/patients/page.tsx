"use client";

import Link from "next/link";
import { RefreshCw, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { searchPatients } from "@/services/practitioner.service";
import type { PatientResponse } from "@/types/api";

export default function PractitionerPatientsPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(search = query) {
    setLoading(true);
    setError(null);
    try {
      setPatients(await searchPatients(search));
    } catch {
      setError("Unable to load your patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []);

  return <div className="mx-auto max-w-6xl space-y-6">
    <header>
      <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Clinical directory</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">My Patients</h1>
      <p className="mt-1 text-xs text-zinc-500">View and manage the clinical records and document archives of your patients.</p>
    </header>
    <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="flex gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-9 text-xs" placeholder="Search your patients by name, phone, or national ID" /></div>
        <button className="btn-primary">Search</button>
        <button type="button" onClick={() => load()} className="btn-secondary" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>
      </form>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      {loading ? <div className="py-10 text-center text-xs text-zinc-500"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-brand" />Loading your patients…</div> : patients.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{patients.map((patient) => <Link key={patient.id} href={`/practitioner/patients/${patient.id}`} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:hover:border-brand/30"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-brand/10 dark:text-brand"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{patient.firstName} {patient.lastName}</p><p className="truncate text-xs text-zinc-500">{patient.email} · {patient.phone || "No phone"}</p></div></Link>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-white/[0.12]">No patients assigned through your appointments.</p>}
    </section>
  </div>;
}
