"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CalendarClock, Clock3, Download, Edit3, FileText, HeartPulse, RefreshCw, Save, ShieldCheck, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { getHealthBackground, getPatientTimeline, updateHealthBackground } from "@/services/clinical.service";
import { listPatientConsultations } from "@/services/consultation.service";
import type { ConsultationResponse, HealthBackgroundRequest, HealthBackgroundResponse, TimelineEntry } from "@/types/api";
import { archiveDocument, downloadDocument, listDocumentTypes, listPatientDocuments, uploadPatientDocument } from "@/services/document.service";
import type { DocumentResponse, LookupResponse } from "@/types/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ClinicalRecord({ patientId, patientName, canEdit, canViewConsultations = false }: {
  patientId: string;
  patientName: string;
  canEdit: boolean;
  canViewConsultations?: boolean;
}) {
  const [background, setBackground] = useState<HealthBackgroundResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [draft, setDraft] = useState<HealthBackgroundRequest>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [documentTypes, setDocumentTypes] = useState<LookupResponse[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthBackground, patientTimeline] = await Promise.all([
        getHealthBackground(patientId),
        getPatientTimeline(patientId),
      ]);
      setBackground(healthBackground);
      setDraft(healthBackground);
      setTimeline(patientTimeline);
      if (canViewConsultations) setConsultations(await listPatientConsultations(patientId));
      setDocuments(await listPatientDocuments(patientId));
      setDocumentTypes(await listDocumentTypes());
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to load the clinical record.");
    } finally {
      setLoading(false);
    }
  }, [canViewConsultations, patientId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const saved = await updateHealthBackground(patientId, draft);
      setBackground(saved);
      setDraft(saved);
      setEditing(false);
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to save the health background.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument() {
      if (!selectedFile || !documentType) {
        setError("Select a document type and file before uploading.");
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const saved = await uploadPatientDocument(patientId, selectedFile, documentType, consultationId || undefined);
        setDocuments((current) => [saved, ...current]);
        setSelectedFile(null);
        setDocumentType("");
        setConsultationId("");
      } catch (err) {
        const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
        setError(data?.detail || data?.message || "Unable to upload the document.");
      } finally {
        setUploading(false);
      }
    }

  async function removeDocument(id: string) {
      try {
        await archiveDocument(id);
        setDocuments((current) => current.filter((item) => item.id !== id));
      } catch {
        setError("Unable to archive the document.");
    }
  }

  if (loading) return <div className="card p-10 text-center text-sm text-zinc-500"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-brand" />Loading clinical record…</div>;

  return <div className="space-y-6">
    {error && <div className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Protected clinical record</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{patientName}</h1>
        <p className="mt-1 text-xs text-zinc-500">Health background and chronological care history</p>
      </div>
      <button onClick={load} className="btn-secondary"><RefreshCw className="h-3.5 w-3.5" />Refresh record</button>
    </div>

    <section className="card overflow-hidden border-zinc-200/80 bg-white shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/80 px-5 py-4 dark:border-white/[0.08] dark:bg-obsidian-850/50">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-brand/10 dark:text-brand"><HeartPulse className="h-4 w-4" /></div><div><h2 className="font-semibold text-zinc-900 dark:text-white">Health background</h2><p className="text-xs text-zinc-500">{background?.updatedAt ? `Updated ${formatDate(background.updatedAt)}` : "No updates recorded"}</p></div></div>
        {canEdit && !editing && <button onClick={() => setEditing(true)} className="btn-secondary"><Edit3 className="h-3.5 w-3.5" />Edit</button>}
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        {(["chronicConditions", "allergies", "longTermMedications"] as const).map((field) => <label key={field} className="block"><span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{field === "chronicConditions" ? "Chronic conditions" : field === "longTermMedications" ? "Long-term medications" : "Allergies"}</span>{editing ? <textarea value={draft[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} rows={4} className="input mt-2 min-h-24 resize-y text-xs" placeholder="Not recorded" /> : <p className="mt-2 min-h-24 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-sm text-zinc-700 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:text-zinc-300">{background?.[field] || "Not recorded"}</p>}</label>)}
      </div>
      {editing && <div className="flex justify-end gap-2 border-t border-zinc-200/80 px-5 py-4 dark:border-white/[0.08]"><button onClick={() => { setDraft(background || {}); setEditing(false); }} className="btn-secondary">Discard</button><button onClick={save} disabled={saving} className="btn-primary"><Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save background"}</button></div>}
    </section>
    {canViewConsultations && <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"><FileText className="h-4 w-4" /></div><div><h2 className="font-semibold text-zinc-900 dark:text-white">Consultation records</h2><p className="text-xs text-zinc-500">Past encounters, diagnoses, and prescriptions</p></div></div>
      {consultations.length ? <div className="space-y-2">{consultations.map((item) => <Link key={item.id} href={`/practitioner/consultations/${item.id}`} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:hover:border-brand/30"><div><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{item.diagnosis || "Diagnosis not recorded"}</p><p className="mt-1 text-xs text-zinc-500">{item.status === "CLOSED" ? "Finalized" : "Open encounter"} · {item.prescription.length} medication{item.prescription.length === 1 ? "" : "s"}</p></div><span className="font-mono text-[10px] text-emerald-700 dark:text-brand">{new Date(item.openedAt).toLocaleDateString()}</span></Link>)}</div> : <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500 dark:border-white/[0.12]">No consultation records found.</p>}
    </section>}
    {canViewConsultations && <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"><FileText className="h-4 w-4" /></div><div><h2 className="font-semibold text-zinc-900 dark:text-white">Document archive</h2><p className="text-xs text-zinc-500">Upload lab results, scans, and PDFs linked to this patient record.</p></div></div>
      <div className="grid gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 dark:border-white/[0.12] dark:bg-obsidian-850/60 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="input text-xs" />
        <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="input text-xs"><option value="">Document type</option>{documentTypes.map((type) => <option key={type.code} value={type.code}>{type.label}</option>)}</select>
        <select value={consultationId} onChange={(event) => setConsultationId(event.target.value)} className="input text-xs"><option value="">No consultation link</option>{consultations.map((item) => <option key={item.id} value={item.id}>{new Date(item.openedAt).toLocaleDateString()} · {item.diagnosis || "Encounter"}</option>)}</select>
        <button onClick={uploadDocument} disabled={uploading} className="btn-primary"><Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload"}</button>
      </div>
      <div className="mt-4 space-y-2">{documents.length ? documents.map((document) => <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/[0.08] dark:bg-obsidian-850/60 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{document.fileName}</p><p className="mt-1 text-xs text-zinc-500">{document.type} · {(document.sizeBytes / 1024).toFixed(1)} KB · {new Date(document.uploadedAt).toLocaleDateString()}{document.consultationId ? " · Linked consultation" : ""}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => downloadDocument(document.id, document.fileName)} className="btn-secondary"><Download className="h-3.5 w-3.5" />Download</button><button onClick={() => removeDocument(document.id)} className="btn-danger"><Trash2 className="h-3.5 w-3.5" />Archive</button></div></div>) : <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-500 dark:border-white/[0.12]">No active documents found.</p>}</div>
    </section>}

    <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
      <div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"><Activity className="h-4 w-4" /></div><div><h2 className="font-semibold text-zinc-900 dark:text-white">Care timeline</h2><p className="text-xs text-zinc-500">{timeline.length} recorded events</p></div></div>
      {timeline.length ? <div className="relative space-y-5 pl-7 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-zinc-200 dark:before:bg-white/[0.1]">{timeline.map((entry) => <div key={`${entry.at}-${entry.refId}`} className="relative"><span className="absolute -left-[1.65rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-obsidian-900"><span className="h-1.5 w-1.5 rounded-full bg-white" /></span><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{entry.title}</p><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">{entry.type}</p></div><p className="flex items-center gap-1 text-[11px] text-zinc-500"><Clock3 className="h-3 w-3" />{formatDate(entry.at)}</p></div></div>)}</div> : <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-white/[0.12]"><CalendarClock className="mx-auto mb-2 h-5 w-5 text-zinc-400" />No clinical events have been recorded yet.</div>}
    </section>
    <div className="flex items-center gap-2 text-[11px] text-zinc-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />Access is limited to the patient and treating practitioner.</div>
  </div>;
}
