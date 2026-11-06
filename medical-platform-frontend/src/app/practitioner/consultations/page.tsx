"use client";

import Link from "next/link";
import { ArrowRight, FileText, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listPractitionerConsultations } from "@/services/consultation.service";
import type { ConsultationResponse } from "@/types/api";

export default function ConsultationsLandingPage() {
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    listPractitionerConsultations()
      .then(setConsultations)
      .catch(() => setError("Unable to load consultation records."))
      .finally(() => setLoading(false));
  }, []);

  const patients = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; consultations: ConsultationResponse[] }>();
    consultations.forEach((consultation) => {
      const current = grouped.get(consultation.patientId) || {
        id: consultation.patientId,
        name: consultation.patientName,
        consultations: [],
      };
      current.consultations.push(consultation);
      grouped.set(consultation.patientId, current);
    });
    return Array.from(grouped.values())
      .map((patient) => ({
        ...patient,
        consultations: [...patient.consultations].sort(
          (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [consultations]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);

  return <div className="mx-auto max-w-5xl space-y-6">
    <header>
      <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">M4 · Clinical encounters</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Consultations</h1>
      <p className="mt-1 text-xs text-zinc-500">Start and manage encounters from your confirmed appointments.</p>
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/practitioner/agenda" className="card group border-zinc-200/80 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-white/[0.08] dark:bg-obsidian-900 dark:hover:border-brand/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-brand/10 dark:text-brand"><Stethoscope className="h-5 w-5" /></div>
        <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Open from agenda</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Select a confirmed appointment and open its consultation workspace.</p>
        <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Go to agenda <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
      </Link>
      <div className="card border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"><FileText className="h-5 w-5" /></div>
        <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Clinical records</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Patient consultation history, diagnoses, prescriptions, and follow-up plans are available from each patient clinical record.</p>
      </div>
    </div>
    <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><h2 className="font-semibold text-zinc-900 dark:text-white">{selectedPatient ? `${selectedPatient.name} · Consultations` : "Select a patient"}</h2><p className="text-xs text-zinc-500">{selectedPatient ? "Consultations are ordered from newest to oldest." : "Choose a patient to view their consultation history."}</p></div>
        <div className="flex gap-2">
          {selectedPatient && <button onClick={() => setSelectedPatientId(null)} className="btn-secondary">All patients</button>}
          <button onClick={() => { setLoading(true); setError(null); listPractitionerConsultations().then(setConsultations).catch(() => setError("Unable to load consultation records.")).finally(() => setLoading(false)); }} className="btn-secondary"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      {loading ? <div className="py-8 text-center text-xs text-zinc-500"><RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin text-brand" />Loading patients…</div> : selectedPatient ? <div className="space-y-2">{selectedPatient.consultations.map((item) => <Link key={item.id} href={`/practitioner/consultations/${item.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:hover:border-brand/30"><div className="min-w-0"><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{item.diagnosis || "Diagnosis not recorded"}</p><p className="mt-1 text-xs text-zinc-500">{item.status === "CLOSED" ? "Finalized" : "Open encounter"} · {item.prescription.length} medication{item.prescription.length === 1 ? "" : "s"}</p></div><div className="shrink-0 text-right"><span className={item.status === "CLOSED" ? "badge-inactive" : "badge-active"}>{item.status === "CLOSED" ? "Closed" : "Open"}</span><p className="mt-1 font-mono text-[10px] text-emerald-700 dark:text-brand">{new Date(item.openedAt).toLocaleDateString()}</p></div></Link>)}</div> : patients.length ? <div className="grid gap-3 sm:grid-cols-2">{patients.map((patient) => <button key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:hover:border-brand/30"><div><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{patient.name}</p><p className="mt-1 text-xs text-zinc-500">{patient.consultations.length} consultation{patient.consultations.length === 1 ? "" : "s"}</p></div><ArrowRight className="h-4 w-4 text-emerald-600 dark:text-brand" /></button>)}</div> : <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500 dark:border-white/[0.12]">No consultation records found.</p>}
    </section>
  </div>;
}
