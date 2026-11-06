"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, LockKeyhole, Plus, Printer, RefreshCw, Save, Stethoscope, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  closeConsultation,
  getConsultation,
  issuePrescription,
  listConsultationVersions,
  saveConsultationFollowUp,
  saveConsultationNotes,
} from "@/services/consultation.service";
import type { ConsultationResponse, ConsultationVersionResponse, PrescriptionItemRequest } from "@/types/api";

const emptyItem: PrescriptionItemRequest = { medication: "", dosage: "", frequency: "", durationDays: undefined };

export default function ConsultationPage() {
  const { isPractitioner, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consultation, setConsultation] = useState<ConsultationResponse | null>(null);
  const [notes, setNotes] = useState({ chiefComplaint: "", physicalFindings: "", diagnosis: "" });
  const [followUp, setFollowUp] = useState({ followUpDate: "", routineChecks: "", careInstructions: "" });
  const [items, setItems] = useState<PrescriptionItemRequest[]>([{ ...emptyItem }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionSaved, setSectionSaved] = useState({ notes: false, prescription: false, followUp: false });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ConsultationVersionResponse[]>([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const value = await getConsultation(id);
      setConsultation(value);
      setNotes({ chiefComplaint: value.chiefComplaint || "", physicalFindings: value.physicalFindings || "", diagnosis: value.diagnosis || "" });
      setFollowUp({ followUpDate: value.followUpDate || "", routineChecks: value.routineChecks || "", careInstructions: value.careInstructions || "" });
      setItems(value.prescription.length ? value.prescription.map((item) => ({ ...item })) : [{ ...emptyItem }]);
      setVersions(await listConsultationVersions(id));
      setSectionSaved({
        notes: Boolean(value.chiefComplaint || value.physicalFindings || value.diagnosis) || value.status === "CLOSED",
        prescription: value.prescription.length > 0 || value.status === "CLOSED",
        followUp: Boolean(value.followUpDate || value.routineChecks || value.careInstructions) || value.status === "CLOSED",
      });
    } catch { setError("Unable to load the consultation."); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (!authLoading && isPractitioner) load(); }, [authLoading, isPractitioner, load]);

  async function save(action: () => Promise<ConsultationResponse>, success: string, section?: keyof typeof sectionSaved) {
    setSaving(true); setError(null); setMessage(null);
    try {
      const updated = await action();
      setConsultation(updated);
      if (section) setSectionSaved((current) => ({ ...current, [section]: true }));
      setMessage(success);
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to update the consultation.");
    } finally { setSaving(false); }
  }

  async function submitNotes(event: FormEvent) {
    event.preventDefault();
    await save(() => saveConsultationNotes(id, notes), "Encounter notes saved.", "notes");
  }

  async function submitFollowUp(event: FormEvent) {
    event.preventDefault();
    await save(() => saveConsultationFollowUp(id, { ...followUp, followUpDate: followUp.followUpDate || undefined }), "Follow-up plan saved.", "followUp");
  }

  async function submitPrescription(event: FormEvent) {
    event.preventDefault();
    if (items.some((item) => !item.medication.trim() || !item.dosage.trim() || !item.frequency.trim())) {
      setError("Complete medication, dosage, and frequency for every prescription item.");
      return;
    }
    await save(() => issuePrescription(id, { items }), "Prescription issued.", "prescription");
  }

  if (authLoading || loading) return <div className="p-10 text-center text-sm text-zinc-500"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-brand" />Loading consultation…</div>;
  if (!isPractitioner || !consultation) return <div className="card p-10 text-center text-sm text-red-600">Practitioner consultation access is required.</div>;
  const closed = consultation.status === "CLOSED";
  const canEdit = editing;
  function updateItem(index: number, field: keyof PrescriptionItemRequest, value: string | number | undefined) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="mb-4 flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-subtle dark:border-white/[0.08] dark:bg-obsidian-900/70 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">M4 · Clinical encounter</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Consultation workspace</h1><p className="mt-1 text-xs text-zinc-500">{canEdit ? "Edit the consultation and save each section." : "Review consultation details. Click Edit consultation to make changes."}</p></div><div className="flex flex-wrap items-center gap-3"><span className={closed ? "badge-inactive" : "badge-active"}>{closed ? "Finalized" : "Open encounter"}</span>{canEdit ? <button onClick={() => { setEditing(false); load(); }} className="btn-secondary">Cancel edit</button> : <button onClick={() => setEditing(true)} className="btn-primary">Edit consultation</button>}<button onClick={() => router.back()} className="btn-secondary">Back to agenda</button></div></header>
    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">{message}</div>}
    {error && <div className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    <fieldset disabled={!canEdit} className="contents">
    <form onSubmit={submitNotes} className="card space-y-5 border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><SectionTitle icon={<Stethoscope className="h-4 w-4" />} title="Encounter notes" subtitle="Chief complaint, physical findings, and final diagnosis" saved={sectionSaved.notes} /><div className="grid gap-4 md:grid-cols-3"><TextArea label="Chief complaint" value={notes.chiefComplaint} disabled={!canEdit} onChange={(value) => { setNotes({ ...notes, chiefComplaint: value }); setSectionSaved((current) => ({ ...current, notes: false })); }} /><TextArea label="Physical findings" value={notes.physicalFindings} disabled={!canEdit} onChange={(value) => { setNotes({ ...notes, physicalFindings: value }); setSectionSaved((current) => ({ ...current, notes: false })); }} /><TextArea label="Final diagnosis" value={notes.diagnosis} disabled={!canEdit} onChange={(value) => { setNotes({ ...notes, diagnosis: value }); setSectionSaved((current) => ({ ...current, notes: false })); }} /></div>{canEdit && <Actions saving={saving} icon={<Save className="h-3.5 w-3.5" />} label="Save notes" />}</form>
    <form onSubmit={submitPrescription} className="card space-y-5 border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><SectionTitle icon={<FileText className="h-4 w-4" />} title="Prescription" subtitle="Issue medications with dosage, frequency, and duration" saved={sectionSaved.prescription} />{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 md:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] dark:border-white/[0.08] dark:bg-obsidian-850/60"><Input label="Medication" value={item.medication} onChange={(value) => { updateItem(index, "medication", value); setSectionSaved((current) => ({ ...current, prescription: false })); }} /><Input label="Dosage" value={item.dosage} onChange={(value) => { updateItem(index, "dosage", value); setSectionSaved((current) => ({ ...current, prescription: false })); }} /><Input label="Frequency" value={item.frequency} onChange={(value) => { updateItem(index, "frequency", value); setSectionSaved((current) => ({ ...current, prescription: false })); }} /><Input label="Duration (days)" type="number" value={item.durationDays?.toString() || ""} onChange={(value) => { updateItem(index, "durationDays", value ? Number(value) : undefined); setSectionSaved((current) => ({ ...current, prescription: false })); }} />{!closed && <button type="button" onClick={() => { setItems(items.filter((_, itemIndex) => itemIndex !== index)); setSectionSaved((current) => ({ ...current, prescription: false })); }} className="self-end rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>)}<div className="flex flex-wrap justify-between gap-2"><button type="button" onClick={() => { setItems([...items, { ...emptyItem }]); setSectionSaved((current) => ({ ...current, prescription: false })); }} className="btn-secondary"><Plus className="h-3.5 w-3.5" />Add medication</button><Actions saving={saving} icon={<FileText className="h-3.5 w-3.5" />} label="Issue prescription" /></div>{closed && <button type="button" onClick={() => window.print()} className="btn-secondary print:hidden"><Printer className="h-3.5 w-3.5" />Print prescription</button>}</form>
    <form onSubmit={submitFollowUp} className="card space-y-5 border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><SectionTitle icon={<CheckCircle2 className="h-4 w-4" />} title="Follow-up plan" subtitle="Follow-up date, routine checks, and care instructions" saved={sectionSaved.followUp} /><div className="grid gap-4 md:grid-cols-3"><Input label="Follow-up date" type="date" value={followUp.followUpDate} onChange={(value) => { setFollowUp({ ...followUp, followUpDate: value }); setSectionSaved((current) => ({ ...current, followUp: false })); }} /><TextArea label="Routine checks" value={followUp.routineChecks} onChange={(value) => { setFollowUp({ ...followUp, routineChecks: value }); setSectionSaved((current) => ({ ...current, followUp: false })); }} /><TextArea label="Care instructions" value={followUp.careInstructions} onChange={(value) => { setFollowUp({ ...followUp, careInstructions: value }); setSectionSaved((current) => ({ ...current, followUp: false })); }} /></div><Actions saving={saving} icon={<Save className="h-3.5 w-3.5" />} label="Save follow-up plan" /></form>
    </fieldset>
    {versions.length > 0 && <section className="card border-zinc-200/80 bg-white p-6 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900"><SectionTitle icon={<RefreshCw className="h-4 w-4" />} title="Version history" subtitle="Previous consultation details are retained." saved /><div className="mt-4 space-y-2">{versions.map((version) => <div key={version.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/[0.08] dark:bg-obsidian-850/60"><div><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Version {version.versionNumber}</p><p className="text-xs text-zinc-500">{version.diagnosis || "Diagnosis not recorded"} · {version.prescription.length} medication{version.prescription.length === 1 ? "" : "s"}</p></div><span className="font-mono text-[10px] text-zinc-500">{new Date(version.capturedAt).toLocaleString()}</span></div>)}</div></section>}
    {!closed && <div className="card flex flex-col gap-4 border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-900 dark:text-amber-200">Finalize consultation</p><p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">Closing marks the appointment completed. A final diagnosis is required.</p></div><button disabled={saving} onClick={() => save(() => closeConsultation(id), "Consultation finalized.")} className="btn-primary"><LockKeyhole className="h-3.5 w-3.5" />Close consultation</button></div>}
  </div>;
}

function SectionTitle({ icon, title, subtitle, saved }: { icon: React.ReactNode; title: string; subtitle: string; saved: boolean }) { return <div className="flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-white/[0.08]"><div className="text-emerald-600 dark:text-brand">{icon}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-zinc-900 dark:text-white">{title}</h2><span className={saved ? "badge-active" : "rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"}>{saved ? "Saved" : "Not saved"}</span></div><p className="text-xs text-zinc-500">{subtitle}</p></div></div>; }
function Input({ label, type = "text", value, disabled, onChange }: { label: string; type?: string; value: string; disabled?: boolean; onChange: (value: string) => void }) { return <label className="text-xs text-zinc-500">{label}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="input mt-1 text-xs disabled:opacity-60" /></label>; }
function TextArea({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) { return <label className="text-xs text-zinc-500">{label}<textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} rows={4} className="input mt-1 min-h-24 resize-y text-xs disabled:opacity-60" /></label>; }
function Actions({ saving, icon, label }: { saving: boolean; icon: React.ReactNode; label: string }) { return <div className="flex justify-end"><button disabled={saving} className="btn-primary">{icon}{saving ? "Saving…" : label}</button></div>; }
