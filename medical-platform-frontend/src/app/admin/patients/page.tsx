"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import {
  archivePatient,
  deletePatientPermanently,
  listPatients,
  restorePatient,
} from "@/services/admin.service";
import type { PatientResponse } from "@/types/api";
import {
  Archive,
  Eye,
  Info,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  Check,
  Copy,
  HeartPulse,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldPlus,
} from "lucide-react";
import clsx from "clsx";
import PatientFormModal from "./PatientFormModal";

type PatientFilter = "ALL" | "WITH_PHONE" | "WITHOUT_PHONE";

export default function PatientsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activePatients, setActivePatients] = useState<PatientResponse[]>([]);
  const [archivedPatients, setArchivedPatients] = useState<PatientResponse[]>([]);
  const [viewSpace, setViewSpace] = useState<"ACTIVE" | "TRASH">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState<PatientFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeletePatient, setConfirmDeletePatient] = useState<PatientResponse | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, archived] = await Promise.all([
        listPatients(false),
        listPatients(true),
      ]);
      setActivePatients(active);
      setArchivedPatients(archived);
    } catch (err) {
      const response = (err as {
        response?: { data?: { detail?: string; message?: string } };
      }).response?.data;
      setError(response?.detail || response?.message || "Failed to synchronize patient directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchPatients();
  }, [fetchPatients, isAdmin]);

  const displayedPatients = viewSpace === "ACTIVE" ? activePatients : archivedPatients;

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return displayedPatients.filter((patient) => {
      const searchable = [
        patient.firstName,
        patient.lastName,
        patient.email,
        patient.phone,
        patient.nationalId,
        patient.insuranceProvider,
        patient.insuranceNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (patientFilter === "WITH_PHONE" && !patient.phone) return false;
      if (patientFilter === "WITHOUT_PHONE" && patient.phone) return false;
      return true;
    });
  }, [displayedPatients, patientFilter, searchQuery]);

  if (authLoading) {
    return <div className="p-10 text-center text-sm text-zinc-500">Checking authorization…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="card p-10 text-center text-sm text-red-600">
        Administrator access is required to manage patients.
      </div>
    );
  }

  async function handleArchive(patient: PatientResponse) {
    if (!confirm(`Move ${patient.firstName} ${patient.lastName} to Trash space?`)) return;
    setActionId(patient.id);
    try {
      await archivePatient(patient.id);
      setActivePatients((current) => current.filter((item) => item.id !== patient.id));
      setArchivedPatients((current) => [{ ...patient, archived: true }, ...current]);
      setSelectedPatient(null);
    } catch {
      setError("Failed to move patient to Trash.");
    } finally {
      setActionId(null);
    }
  }

  async function handleRestore(patient: PatientResponse) {
    setActionId(patient.id);
    try {
      await restorePatient(patient.id);
      setArchivedPatients((current) => current.filter((item) => item.id !== patient.id));
      setActivePatients((current) => [{ ...patient, archived: false }, ...current]);
      setSelectedPatient(null);
    } catch {
      setError("Failed to restore patient.");
    } finally {
      setActionId(null);
    }
  }

  async function handlePermanentDelete() {
    if (!confirmDeletePatient) return;
    setIsDeletingPermanently(true);
    try {
      await deletePatientPermanently(confirmDeletePatient.id);
      setArchivedPatients((current) =>
        current.filter((item) => item.id !== confirmDeletePatient.id)
      );
      setSelectedPatient(null);
      setConfirmDeletePatient(null);
    } catch {
      setError("Failed to permanently delete patient.");
    } finally {
      setIsDeletingPermanently(false);
    }
  }

  function handlePatientSaved(patient: PatientResponse) {
    setActivePatients((current) =>
      current.some((item) => item.id === patient.id)
        ? current.map((item) => (item.id === patient.id ? patient : item))
        : [patient, ...current]
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {viewSpace === "ACTIVE" ? "Patient Directory" : "Archived Patients"}
            </h1>
            <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs text-zinc-700 dark:border-white/[0.1] dark:bg-obsidian-800 dark:text-zinc-400">
              {displayedPatients.length} patients
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {viewSpace === "ACTIVE"
              ? "Directory of registered patients and their contact details"
              : "Archived patient records pending restoration or permanent removal"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-zinc-200/90 bg-white p-1 font-mono text-[11px] shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900/90">
            <button
              onClick={() => setViewSpace("ACTIVE")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                viewSpace === "ACTIVE"
                  ? "border border-emerald-200/80 bg-emerald-50 text-emerald-800 shadow-subtle dark:border-brand/30 dark:bg-brand/15 dark:text-brand"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Active ({activePatients.length})</span>
            </button>
            <button
              onClick={() => setViewSpace("TRASH")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                viewSpace === "TRASH"
                  ? "border border-red-200 bg-red-50 text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Trash ({archivedPatients.length})</span>
            </button>
          </div>

          <button onClick={fetchPatients} disabled={loading} className="btn-secondary" title="Refresh Directory">
            <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin text-brand")} />
            <span>Sync</span>
          </button>

        </div>
      </div>

      {viewSpace === "ACTIVE" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="Total Active" value={activePatients.length} icon={<Layers className="h-4 w-4 text-zinc-400" />} />
          <MetricCard label="With Contact" value={activePatients.filter((patient) => patient.phone).length} icon={<Users className="h-4 w-4 text-emerald-600 dark:text-brand" />} />
          <MetricCard label="Visible Records" value={filteredPatients.length} icon={<Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />} />
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs shadow-soft backdrop-blur-xl dark:border-amber-500/30 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Archived Patient Space (Trash)</p>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
              Archived patients cannot sign in. Restore a record to return it to the active directory, or permanently delete it.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-obsidian-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email, phone, or insurance…"
            className="input bg-zinc-50/80 py-2 pl-10 text-xs dark:bg-obsidian-950/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 font-mono text-[10px] dark:border-white/[0.06] dark:bg-obsidian-950/80">
            {([
              ["ALL", "All Patients"],
              ["WITH_PHONE", "With Contact"],
              ["WITHOUT_PHONE", "Missing Contact"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPatientFilter(value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 transition-all",
                  patientFilter === value
                    ? "border border-zinc-200/80 bg-white text-zinc-900 shadow-subtle dark:border-white/[0.15] dark:bg-white/[0.1] dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 font-mono text-[10px] dark:border-white/[0.06] dark:bg-obsidian-950/80">
            {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setViewSpace(tab === "ARCHIVED" ? "TRASH" : "ACTIVE")}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 transition-all",
                  (tab === "ARCHIVED" ? viewSpace === "TRASH" : viewSpace === "ACTIVE")
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-subtle dark:border-brand/30 dark:bg-brand/15 dark:text-brand"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
        <Info className="h-3.5 w-3.5 text-emerald-500" />
        <span>Select any patient row to view the full patient profile and contact details.</span>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 font-mono text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="card overflow-hidden border border-zinc-200/80 bg-white p-0 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand" />
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-zinc-500">Synchronizing Patient Directory…</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/[0.08] dark:bg-obsidian-850">
              {viewSpace === "ACTIVE" ? <Users className="h-6 w-6 text-zinc-400 dark:text-zinc-500" /> : <Archive className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />}
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-300">
              {viewSpace === "ACTIVE"
                ? searchQuery ? "No matching patients found" : "No active patients registered"
                : searchQuery ? "No matching archived patients found" : "Trash space is empty"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {viewSpace === "ACTIVE" ? "Enroll a patient to populate the active directory" : "Archived patients will appear here for restoration or permanent deletion"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/90 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:text-zinc-400">
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Date of Birth</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Insurance</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.04]">
                {filteredPatients.map((patient) => {
                  const processing = actionId === patient.id;
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="group cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]"
                      title="Click to view patient profile"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 font-mono text-xs font-semibold text-emerald-700 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
                            {patient.firstName?.charAt(0) || "P"}{patient.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-brand">
                              <span>{patient.firstName} {patient.lastName}</span>
                              <ChevronRight className="h-3 w-3 text-zinc-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-zinc-600" />
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{patient.dateOfBirth}</td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-700 dark:text-zinc-300">{patient.phone || "No phone"}</div>
                        <div className="text-[10px] text-zinc-500">{patient.address || "No address"}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{patient.insuranceProvider || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={patient.archived ? "badge-inactive" : "badge-active"}>
                          <span className={clsx("h-1.5 w-1.5 rounded-full", patient.archived ? "bg-zinc-400" : "bg-emerald-500")} />
                          {patient.archived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelectedPatient(patient)} className="btn-secondary px-3 py-2" title="View patient">
                            <Eye className="h-3.5 w-3.5" /><span className="hidden xl:inline">View</span>
                          </button>
                          {viewSpace === "ACTIVE" ? (
                            <>
                              <button disabled={processing} onClick={() => handleArchive(patient)} className="btn-danger px-3 py-2" title="Archive patient">
                                <Archive className="h-3.5 w-3.5" /><span className="hidden xl:inline">Trash</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button disabled={processing} onClick={() => handleRestore(patient)} className="btn-secondary px-3 py-2" title="Restore patient">
                                <RotateCcw className="h-3.5 w-3.5" /><span className="hidden xl:inline">Restore</span>
                              </button>
                              <button disabled={processing} onClick={() => setConfirmDeletePatient(patient)} className="btn-danger px-3 py-2" title="Delete permanently">
                                <Trash2 className="h-3.5 w-3.5" /><span className="hidden xl:inline">Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientFormModal
        patient={editingPatient}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPatient(null); }}
        onSaved={handlePatientSaved}
      />

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onEdit={(patient) => {
            setSelectedPatient(null);
            setEditingPatient(patient);
            setIsFormOpen(true);
          }}
          onArchiveToggle={handleArchive}
          onRestore={handleRestore}
          onDeletePermanent={(patient) => setConfirmDeletePatient(patient)}
        />
      )}

      {confirmDeletePatient && (
        createPortal(<div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-md dark:bg-obsidian-950/85">
          <div className="card relative w-full max-w-md border border-red-200 bg-white p-6 shadow-2xl dark:border-red-500/30 dark:bg-obsidian-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400"><AlertTriangle className="h-5 w-5" /></div>
                <div><h3 className="text-sm font-bold text-zinc-900 dark:text-white">Permanently Delete Patient</h3><p className="font-mono text-[10px] font-semibold uppercase text-red-600 dark:text-red-400">Irreversible Removal</p></div>
              </div>
              <button onClick={() => setConfirmDeletePatient(null)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              Permanently delete <strong className="text-zinc-900 dark:text-white">{confirmDeletePatient.firstName} {confirmDeletePatient.lastName}</strong>? This removes the patient account and linked clinical records.
            </p>
            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-white/[0.06]">
              <button onClick={() => setConfirmDeletePatient(null)} disabled={isDeletingPermanently} className="btn-secondary">Cancel</button>
              <button onClick={handlePermanentDelete} disabled={isDeletingPermanently} className="btn-danger"><Trash2 className="h-3.5 w-3.5" />{isDeletingPermanently ? "Deleting…" : "Delete Permanently"}</button>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-obsidian-900/60">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"><span>{label}</span>{icon}</div>
      <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</p>
      <span className="mt-1 block font-mono text-[10px] text-zinc-500 dark:text-zinc-400">Patient records</span>
    </div>
  );
}

function PatientDetailsModal({
  patient,
  onClose,
  onEdit,
  onArchiveToggle,
  onRestore,
  onDeletePermanent,
}: {
  patient: PatientResponse;
  onClose: () => void;
  onEdit: (patient: PatientResponse) => void;
  onArchiveToggle: (patient: PatientResponse) => void;
  onRestore: (patient: PatientResponse) => void;
  onDeletePermanent: (patient: PatientResponse) => void;
}) {
  const [copied, setCopied] = useState<"id" | "email" | null>(null);

  function copy(value: string, type: "id" | "email") {
    navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-900/40 p-4 backdrop-blur-md dark:bg-obsidian-950/85">
      <div className="card relative my-4 w-full max-w-xl border-zinc-200 bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-obsidian-900/95 sm:p-6">
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-lg font-bold text-emerald-700 shadow-subtle dark:border-brand/40 dark:bg-brand/10 dark:text-brand">
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{patient.firstName} {patient.lastName}</h2>
                <span className={clsx(patient.archived ? "badge-inactive" : "badge-active", "inline-flex items-center gap-1.5")}>
                  <span className={clsx("h-1.5 w-1.5 rounded-full", patient.archived ? "bg-zinc-400" : "animate-pulse bg-emerald-500")} />
                  {patient.archived ? "Archived" : "Active"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold uppercase text-emerald-700 dark:text-brand">Patient</span>
                <span>•</span><span>ID: {patient.id.slice(0, 12)}…</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]" title="Close dossier"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard icon={<Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />} label="Email Address" value={patient.email} action={<button onClick={() => copy(patient.email, "email")} className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">{copied === "email" ? <><Check className="h-3 w-3 text-emerald-600 dark:text-brand" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}</button>} />
            <DetailCard icon={<Phone className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />} label="Phone Contact" value={patient.phone} />
            <DetailCard icon={<CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />} label="Date of Birth" value={patient.dateOfBirth} />
            <DetailCard icon={<KeyRound className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />} label="National ID" value={patient.nationalId} action={patient.nationalId ? <button onClick={() => copy(patient.nationalId!, "id")} className="font-mono text-[9px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white">{copied === "id" ? "Copied" : "Copy"}</button> : undefined} />
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 sm:col-span-2 dark:border-white/[0.06] dark:bg-obsidian-850/60">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Patient Identifier (UUID)</span>
                <button onClick={() => copy(patient.id, "id")} className="flex items-center gap-1 text-[9px] hover:text-zinc-900 dark:hover:text-white">
                  {copied === "id" ? <><Check className="h-3 w-3 text-emerald-600 dark:text-brand" />Copied</> : <><Copy className="h-3 w-3" />Copy ID</>}
                </button>
              </div>
              <p className="mt-1.5 break-all select-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{patient.id}</p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-brand/20 dark:bg-brand/5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-brand"><HeartPulse className="h-3.5 w-3.5" /> Demographics & Clinical Identity</div>
            <div className="mt-3 grid grid-cols-2 gap-4"><DetailValue label="Gender" value={patient.gender} /><DetailValue label="Blood type" value={patient.bloodType} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard icon={<MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />} label="Address" value={patient.address} />
            <DetailCard icon={<ShieldPlus className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />} label="Insurance" value={patient.insuranceProvider} secondary={patient.insuranceNumber} />
            <DetailCard label="Emergency Contact" value={patient.emergencyContactName} secondary={patient.emergencyContactPhone} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            {!patient.archived ? (
              <button type="button" onClick={() => { onArchiveToggle(patient); onClose(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 font-mono text-xs text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-400">
                <Archive className="h-3.5 w-3.5" /><span>Move to Trash</span>
              </button>
            ) : (
              <>
                <button type="button" onClick={() => { onRestore(patient); onClose(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-700 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
                  <RotateCcw className="h-3.5 w-3.5" /><span>Restore Patient</span>
                </button>
                <button type="button" onClick={() => { onDeletePermanent(patient); onClose(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" /><span>Expunge Permanently</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Dismiss</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DetailCard({ icon, label, value, secondary, action }: { icon?: React.ReactNode; label: string; value?: string | null; secondary?: string | null; action?: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-white/[0.06] dark:bg-obsidian-850/60"><div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"><span className="flex items-center gap-1.5">{icon}{label}</span>{action}</div><p className="mt-1 truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">{value || "Not provided"}</p>{secondary && <p className="mt-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{secondary}</p>}</div>;
}

function DetailValue({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 font-mono text-xs text-zinc-800 dark:text-zinc-200">{value || "Not specified"}</dd></div>;
}
