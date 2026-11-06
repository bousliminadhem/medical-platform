"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { searchAudit } from "@/services/admin.service";
import type { AuditAction, AuditEntry } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

const ACTIONS: AuditAction[] = [
  "LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGOUT", "ACCOUNT_CREATED",
  "ACCOUNT_LOCKED", "PASSWORD_CHANGED", "PROFILE_UPDATED", "RECORD_VIEWED",
  "RECORD_SEARCHED", "RECORD_ARCHIVED", "APPOINTMENT_CHANGED",
  "DOCUMENT_UPLOADED", "DOCUMENT_VIEWED", "DOCUMENT_CHANGED",
  "DOCUMENT_ARCHIVED", "INTEGRITY_FAILURE", "FINDING_REVIEWED",
  "CONSULTATION_OPENED", "PRESCRIPTION_ISSUED", "CONSULTATION_CLOSED",
  "LOOKUP_CHANGED",
];

export default function AuditPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [action, setAction] = useState<AuditAction | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchAudit(action ? { action, size: 100 } : { size: 100 });
      setEntries(result.content);
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Failed to load the audit trail.");
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (authLoading) return <div className="p-10 text-center text-sm text-zinc-500">Checking authorization…</div>;
  if (!isAdmin) return <div className="card p-10 text-center text-sm text-red-600">Administrator access is required.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Audit Trail</h1>
            <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 font-mono text-xs text-zinc-700 dark:border-white/[0.1] dark:bg-obsidian-800 dark:text-zinc-400">Last 7 days</span>
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Review account, record-access, and profile-change events.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={action} onChange={(event) => setAction(event.target.value as AuditAction | "")} className="input w-56 font-mono text-xs">
            <option value="">All actions</option>
            {ACTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
          </select>
          <button onClick={load} disabled={loading} className="btn-secondary"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</button>
        </div>
      </div>

      {error && <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 font-mono text-xs text-red-400"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="card overflow-hidden border border-zinc-200/80 bg-white p-0 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center"><RefreshCw className="h-6 w-6 animate-spin text-brand" /><p className="mt-3 font-mono text-xs uppercase tracking-widest text-zinc-500">Loading audit trail…</p></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center"><ClipboardList className="h-8 w-8 text-zinc-400" /><p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-300">No audit events found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-zinc-200/80 bg-zinc-50/90 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-white/[0.08] dark:bg-obsidian-850/60"><th className="px-6 py-3.5">Time</th><th className="px-6 py-3.5">Actor</th><th className="min-w-48 px-6 py-3.5">Action</th><th className="px-6 py-3.5">Target record</th><th className="px-6 py-3.5">Event details</th><th className="px-6 py-3.5">Source</th></tr></thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.04]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-[10px] text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-700 dark:text-zinc-300">{entry.actorEmail || "System"}</div>
                      {entry.actorId && <div className="mt-1 break-all font-mono text-[9px] text-zinc-500">Actor ID: {entry.actorId}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4"><span className="inline-flex whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">{entry.action.replaceAll("_", " ")}</span></td>
                    <td className="min-w-52 max-w-xs px-6 py-4">
                      <div className="font-semibold text-zinc-700 dark:text-zinc-300">{entry.targetType || "System event"}</div>
                      {entry.targetId ? <div className="mt-1 break-all font-mono text-[10px] leading-relaxed text-zinc-500" title={entry.targetId}>Target ID: {entry.targetId}</div> : <div className="mt-1 font-mono text-[10px] text-zinc-500">No target record</div>}
                    </td>
                    <td className="max-w-sm px-6 py-4 text-zinc-600 dark:text-zinc-400">{entry.details || "No additional details recorded."}</td>
                    <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{entry.ipAddress || "Unavailable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
