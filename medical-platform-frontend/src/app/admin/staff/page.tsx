"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  listStaff,
  setUserEnabled,
  archiveStaff,
  restoreStaff,
  deleteStaffPermanently,
} from "@/services/admin.service";
import {
  listPractitioners,
  setPractitionerActive,
} from "@/services/practitioner.service";
import type { StaffResponse, Role } from "@/types/api";
import {
  UserPlus,
  Clock,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
  Search,
  Users,
  ShieldAlert,
  UserCheck,
  Stethoscope,
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
  X,
  Layers,
  ChevronRight,
  Info,
  Pencil,
} from "lucide-react";
import clsx from "clsx";
import EnrollStaffModal from "./EnrollStaffModal";
import StaffProfileModal from "./StaffProfileModal";
import EditStaffModal from "./EditStaffModal";

export default function StaffListPage() {
  const [activeStaff, setActiveStaff] = useState<StaffResponse[]>([]);
  const [trashStaff, setTrashStaff] = useState<StaffResponse[]>([]);
  const [viewSpace, setViewSpace] = useState<"ACTIVE" | "TRASH">("ACTIVE");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Enroll Staff Modal state
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  // Staff Profile Details Modal state
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null);

  // Edit Staff Modal state
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null);

  // Modal for permanent deletion confirmation
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<StaffResponse | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  function handleStaffUpdated(updated: StaffResponse) {
    setActiveStaff((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setTrashStaff((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    if (selectedStaff?.id === updated.id) {
      setSelectedStaff(updated);
    }
  }

  const fetchAllStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both active and trash staff simultaneously
      const [activeData, trashData] = await Promise.all([
        listStaff(false),
        listStaff(true),
      ]);
      setActiveStaff(activeData);
      setTrashStaff(trashData);
    } catch {
      // Fallback: if backend hasn't been updated with /api/admin/users yet
      try {
        const fallback = await listPractitioners(true);
        const mapped: StaffResponse[] = fallback.map((p) => ({
          id: p.id,
          email: "",
          firstName: p.firstName,
          lastName: p.lastName,
          role: "PRACTITIONER",
          roles: ["PRACTITIONER"],
          enabled: p.active,
          licenseNumber: p.licenseNumber,
          specialty: p.specialty,
          active: p.active,
          archived: false,
        }));
        setActiveStaff(mapped);
        setTrashStaff([]);
      } catch (innerErr: unknown) {
        const errRes = (innerErr as {
          response?: { data?: { detail?: string; message?: string } };
        })?.response?.data;
        setError(
          errRes?.detail ||
            errRes?.message ||
            "Failed to synchronize staff directory."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  // Toggle active/enabled state
  async function handleToggleStatus(member: StaffResponse) {
    setActionId(member.id);
    const isCurrentlyActive = member.active ?? member.enabled;
    const targetState = !isCurrentlyActive;

    try {
      if (member.role === "PRACTITIONER") {
        await setPractitionerActive(member.id, targetState);
      } else {
        await setUserEnabled(member.id, targetState);
      }

      setActiveStaff((prev) =>
        prev.map((s) =>
          s.id === member.id
            ? { ...s, active: targetState, enabled: targetState }
            : s
        )
      );

      // Keep selectedStaff in sync if modal is open
      setSelectedStaff((prev) =>
        prev && prev.id === member.id
          ? { ...prev, active: targetState, enabled: targetState }
          : prev
      );
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      alert(errRes?.detail || "Failed to update member status.");
    } finally {
      setActionId(null);
    }
  }

  // Soft Delete (Move to Trash / Archive)
  async function handleArchive(member: StaffResponse) {
    if (!confirm(`Move ${member.firstName} ${member.lastName} to Trash space?`)) {
      return;
    }
    setActionId(member.id);
    try {
      await archiveStaff(member.id);
      setActiveStaff((prev) => prev.filter((s) => s.id !== member.id));
      setTrashStaff((prev) => [{ ...member, archived: true, enabled: false }, ...prev]);
      if (selectedStaff?.id === member.id) {
        setSelectedStaff(null);
      }
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      alert(errRes?.detail || "Failed to move staff member to Trash.");
    } finally {
      setActionId(null);
    }
  }

  // Restore from Trash
  async function handleRestore(member: StaffResponse) {
    setActionId(member.id);
    try {
      await restoreStaff(member.id);
      setTrashStaff((prev) => prev.filter((s) => s.id !== member.id));
      setActiveStaff((prev) => [{ ...member, archived: false, enabled: true }, ...prev]);
      if (selectedStaff?.id === member.id) {
        setSelectedStaff(null);
      }
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      alert(errRes?.detail || "Failed to restore staff member.");
    } finally {
      setActionId(null);
    }
  }

  // Permanent Delete (Cascade)
  async function handleExecutePermanentDelete() {
    if (!confirmDeleteMember) return;
    setIsDeletingPermanently(true);
    try {
      await deleteStaffPermanently(confirmDeleteMember.id);
      setTrashStaff((prev) => prev.filter((s) => s.id !== confirmDeleteMember.id));
      if (selectedStaff?.id === confirmDeleteMember.id) {
        setSelectedStaff(null);
      }
      setConfirmDeleteMember(null);
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      alert(errRes?.detail || "Failed to permanently expunge member.");
    } finally {
      setIsDeletingPermanently(false);
    }
  }

  // Active roster vs Trash roster
  const displayedStaff = viewSpace === "ACTIVE" ? activeStaff : trashStaff;

  // Filtered staff list
  const filtered = useMemo(() => {
    return displayedStaff.filter((s) => {
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const email = (s.email || "").toLowerCase();
      const specialty = (s.specialty || "").toLowerCase();
      const license = (s.licenseNumber || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
        email.includes(q) ||
        specialty.includes(q) ||
        license.includes(q);

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== "ALL" && s.role !== roleFilter) {
        return false;
      }

      // Status filter (only applicable in ACTIVE view)
      if (viewSpace === "ACTIVE") {
        const isActive = s.active ?? s.enabled;
        if (statusFilter === "ACTIVE") return isActive;
        if (statusFilter === "INACTIVE") return !isActive;
      }

      return true;
    });
  }, [displayedStaff, searchQuery, roleFilter, statusFilter, viewSpace]);

  const activeStaffCount = activeStaff.length;
  const trashStaffCount = trashStaff.length;
  const doctorCount = activeStaff.filter((s) => s.role === "PRACTITIONER").length;
  const assistantCount = activeStaff.filter((s) => s.role === "MEDICAL_ASSISTANT").length;
  const adminCount = activeStaff.filter((s) => s.role === "ADMIN").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner / Metrics bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {viewSpace === "ACTIVE" ? "Medical Staff Directory" : "Archived Personnel"}
            </h1>
            <span className="font-mono text-xs rounded-full border border-zinc-300 dark:border-white/[0.1] bg-zinc-100 dark:bg-obsidian-800 px-2.5 py-0.5 text-zinc-700 dark:text-zinc-400">
              {viewSpace === "ACTIVE" ? activeStaffCount : trashStaffCount} members
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {viewSpace === "ACTIVE"
              ? "Comprehensive directory of clinical practitioners, medical assistants, and administrators"
              : "Suspended staff records pending reactivation or permanent cascading removal"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Space Switcher Pill */}
          <div className="flex items-center rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/90 p-1 font-mono text-[11px] shadow-soft backdrop-blur-md">
            <button
              onClick={() => setViewSpace("ACTIVE")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                viewSpace === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-subtle dark:bg-brand/15 dark:text-brand dark:border-brand/30"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Active ({activeStaffCount})</span>
            </button>

            <button
              onClick={() => setViewSpace("TRASH")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                viewSpace === "TRASH"
                  ? "bg-red-50 text-red-700 border border-red-200 shadow-subtle dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Trash ({trashStaffCount})</span>
            </button>
          </div>

          <button
            onClick={fetchAllStaff}
            disabled={loading}
            className="btn-secondary"
            title="Refresh Directory"
          >
            <RefreshCw
              className={clsx("h-3.5 w-3.5", loading && "animate-spin text-brand")}
            />
            <span>Sync</span>
          </button>

          {/* Enroll Staff Button opens modal exclusively */}
          {viewSpace === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setIsEnrollOpen(true)}
              className="btn-primary"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Enroll Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards (only shown in ACTIVE space) */}
      {viewSpace === "ACTIVE" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/60 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Total Active</span>
              <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              {activeStaffCount}
            </p>
            <span className="mt-1 block text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Operational staff on duty
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/60 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Practitioners</span>
              <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-brand" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-brand font-mono">
              {doctorCount}
            </p>
            <span className="mt-1 block text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Doctors & Clinicians
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/60 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Assistants</span>
              <UserCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 font-mono">
              {assistantCount}
            </p>
            <span className="mt-1 block text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Medical Assistants
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/60 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Administrators</span>
              <ShieldAlert className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 font-mono">
              {adminCount}
            </p>
            <span className="mt-1 block text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Security & Ops
            </span>
          </div>
        </div>
      ) : (
        /* Trash Warning Banner */
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/20 p-4 text-xs shadow-soft backdrop-blur-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Archived Staff Space (Trash)
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Personnel in this space are suspended and cannot sign in. You can{" "}
              <strong className="text-zinc-900 dark:text-zinc-200">Restore</strong> them to active duty, or{" "}
              <strong className="text-red-600 dark:text-red-400">Delete Permanently</strong>. Permanent deletion
              executes a cascade that deletes all linked clinical appointments, consultations, working hours, and authentication records.
            </p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-obsidian-900/70 p-4 sm:flex-row sm:items-center sm:justify-between shadow-soft backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 dark:text-zinc-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, specialty, or license…"
            className="input pl-10 text-xs py-2 bg-zinc-50/80 dark:bg-obsidian-950/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/70 dark:border-white/[0.06] dark:bg-obsidian-950/80 p-1 font-mono text-[10px]">
            {(
              [
                ["ALL", "All Roles"],
                ["PRACTITIONER", "Doctors"],
                ["MEDICAL_ASSISTANT", "Assistants"],
                ["ADMIN", "Admins"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setRoleFilter(value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 transition-all",
                  roleFilter === value
                    ? "bg-white text-zinc-900 border border-zinc-200/80 shadow-subtle dark:bg-white/[0.1] dark:text-white dark:border-white/[0.15]"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status Filter (only active space) */}
          {viewSpace === "ACTIVE" && (
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/70 dark:border-white/[0.06] dark:bg-obsidian-950/80 p-1 font-mono text-[10px]">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={clsx(
                    "rounded-lg px-2.5 py-1.5 transition-all",
                    statusFilter === tab
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-subtle dark:bg-brand/15 dark:text-brand dark:border-brand/30"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row click hint */}
      <div className="flex items-center gap-2 px-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
        <Info className="h-3.5 w-3.5 text-emerald-500" />
        <span>Select any staff row to view full clinical profile, license details, and schedule.</span>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 font-mono text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="card overflow-hidden p-0 border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 shadow-soft">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand" />
            <p className="mt-3 font-mono text-xs text-zinc-500 uppercase tracking-widest">
              Synchronizing Staff Roster…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-obsidian-850">
              {viewSpace === "ACTIVE" ? (
                <Users className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
              ) : (
                <Archive className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-300">
              {viewSpace === "ACTIVE"
                ? searchQuery
                  ? "No matching personnel found"
                  : "No active staff members registered"
                : searchQuery
                ? "No matching archived staff found"
                : "Trash space is empty"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {viewSpace === "ACTIVE"
                ? "Enroll a doctor, assistant, or administrator to populate the active directory"
                : "Archived staff members will appear here where you can restore or permanently delete them"}
            </p>
            {viewSpace === "ACTIVE" && !searchQuery && (
              <button
                type="button"
                onClick={() => setIsEnrollOpen(true)}
                className="btn-primary mt-5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Enroll Staff Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/90 dark:border-white/[0.08] dark:bg-obsidian-850/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Clinical Role</th>
                  <th className="px-6 py-3.5">Specialty</th>
                  <th className="px-6 py-3.5">License / ID</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.04]">
                {filtered.map((member) => {
                  const isActive = member.active ?? member.enabled;
                  const isDoc = member.role === "PRACTITIONER";
                  const isAssistant = member.role === "MEDICAL_ASSISTANT";
                  const isAdmin = member.role === "ADMIN";
                  const isProcessing = actionId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className="group cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]"
                      title="Click to view full personnel dossier"
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-semibold transition-colors",
                              isDoc && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-brand/30 dark:bg-brand/10 dark:text-brand",
                              isAssistant && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
                              isAdmin && "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400"
                            )}
                          >
                            {member.firstName?.charAt(0) || "U"}
                            {member.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-brand transition-colors">
                              <span>
                                {isDoc ? "Dr. " : ""}
                                {member.firstName || "Staff"} {member.lastName || ""}
                              </span>
                              <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                              {member.email || `ID: ${member.id.slice(0, 8)}…`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                            isDoc && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand",
                            isAssistant && "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
                            isAdmin && "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400"
                          )}
                        >
                          {isDoc && <Stethoscope className="h-3 w-3" />}
                          {isAssistant && <UserCheck className="h-3 w-3" />}
                          {isAdmin && <ShieldAlert className="h-3 w-3" />}
                          <span>{member.role?.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Specialty */}
                      <td className="px-6 py-4">
                        {member.specialty ? (
                          <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-700 dark:border-white/[0.06] dark:bg-obsidian-800/80 dark:text-zinc-300">
                            {member.specialty}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* License */}
                      <td className="px-6 py-4">
                        {member.licenseNumber ? (
                          <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-300 tracking-wider">
                            {member.licenseNumber}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                            {member.id.slice(0, 8)}…
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {viewSpace === "ACTIVE" ? (
                          <span className={clsx(isActive ? "badge-active" : "badge-inactive", "whitespace-nowrap inline-flex items-center gap-1.5")}>
                            <span
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                isActive ? "bg-emerald-500 dark:bg-brand animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"
                              )}
                            />
                            <span className="whitespace-nowrap">{isActive ? "Active Duty" : "Disabled"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-600 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-400 whitespace-nowrap">
                            <Archive className="h-3 w-3 shrink-0" />
                            In Trash
                          </span>
                        )}
                      </td>

                      {/* Operations */}
                      <td className="px-6 py-4 text-right">
                        <div
                          className="inline-flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {viewSpace === "ACTIVE" ? (
                            <>
                              {/* Shift matrix link for Doctors */}
                              {isDoc ? (
                                <Link
                                  href={`/admin/staff/${member.id}/working-hours`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-brand transition"
                                  title="Shift Matrix & Working Hours"
                                >
                                  <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                                  <span>Shift Matrix</span>
                                </Link>
                              ) : (
                                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 px-2 py-1.5">
                                  Clinical Only
                                </span>
                              )}

                              {/* Disable / Enable toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(member);
                                }}
                                disabled={isProcessing}
                                className={clsx(
                                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition",
                                  isActive
                                    ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-obsidian-850 dark:text-zinc-400 dark:hover:text-zinc-200"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-brand/20 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20",
                                  isProcessing && "opacity-50 cursor-not-allowed"
                                )}
                                title={isActive ? "Disable Account" : "Enable Account"}
                              >
                                {isActive ? (
                                  <>
                                    <ToggleRight className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                                    <span>Disable</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="h-3.5 w-3.5" />
                                    <span>Enable</span>
                                  </>
                                )}
                              </button>

                              {/* Edit Staff Profile */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStaff(member);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-white transition"
                                title="Edit Staff Member"
                              >
                                <Pencil className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                                <span>Edit</span>
                              </button>

                              {/* Move to Trash (Soft Delete) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(member);
                                }}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1.5 font-mono text-[11px] text-red-600 hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-950/40 transition disabled:opacity-40"
                                title="Move to Trash Space"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Trash</span>
                              </button>
                            </>
                          ) : (
                            /* Operations in TRASH Space */
                            <>
                              {/* Restore Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(member);
                                }}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-mono text-[11px] text-emerald-700 hover:bg-emerald-100 dark:border-brand/30 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20 transition disabled:opacity-40"
                                title="Restore from Trash to Active Roster"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Restore</span>
                              </button>

                              {/* Delete Permanently Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteMember(member);
                                }}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-mono text-[11px] text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-200 transition disabled:opacity-40 shadow-sm"
                                title="Permanently Delete with Cascade"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Permanently</span>
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

      {/* Enroll Staff Modal - Only opened via Enroll Staff Button */}
      <EnrollStaffModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        onEnrolled={fetchAllStaff}
      />

      {/* Staff Profile Details Modal - Opened when clicking any row */}
      <StaffProfileModal
        staff={selectedStaff}
        isOpen={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        onEdit={(staff) => {
          setSelectedStaff(null);
          setEditingStaff(staff);
        }}
        onStatusToggle={handleToggleStatus}
        onArchiveToggle={viewSpace === "ACTIVE" ? handleArchive : handleRestore}
        onDeletePermanent={setConfirmDeleteMember}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        staff={editingStaff}
        isOpen={Boolean(editingStaff)}
        onClose={() => setEditingStaff(null)}
        onUpdated={handleStaffUpdated}
      />

      {/* Confirmation Modal for Permanent Cascading Deletion */}
      {confirmDeleteMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-obsidian-950/85 backdrop-blur-md">
          <div className="card relative w-full max-w-md border border-red-200 dark:border-red-500/30 bg-white dark:bg-obsidian-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Permanently Delete Personnel
                  </h3>
                  <p className="font-mono text-[10px] text-red-600 dark:text-red-400 uppercase font-semibold">
                    IRREVERSIBLE CASCADING REMOVAL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteMember(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              <p>
                You are about to permanently delete{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {confirmDeleteMember.firstName} {confirmDeleteMember.lastName}
                </strong>{" "}
                (<span className="font-mono text-zinc-700 dark:text-zinc-400">{confirmDeleteMember.email || confirmDeleteMember.role}</span>).
              </p>

              <div className="rounded-xl border border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-950/20 p-3 font-mono text-[11px] text-red-800 dark:text-red-300 space-y-1">
                <p className="font-semibold text-red-700 dark:text-red-400">Automatic Cascade Deletions:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                  <li>All scheduled appointments and consultations</li>
                  <li>All working hour matrices & time-off entries</li>
                  <li>User account, role clearances & auth credentials</li>
                </ul>
              </div>

              <p className="text-zinc-500 text-[11px]">
                This action cannot be undone. Are you sure you wish to proceed?
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={() => setConfirmDeleteMember(null)}
                className="btn-secondary"
                disabled={isDeletingPermanently}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePermanentDelete}
                disabled={isDeletingPermanently}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-glow-sm hover:bg-red-700 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeletingPermanently ? "Expunging…" : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
