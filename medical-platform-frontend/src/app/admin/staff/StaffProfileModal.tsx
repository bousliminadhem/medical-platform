"use client";

import { useState } from "react";
import Link from "next/link";
import type { StaffResponse } from "@/types/api";
import {
  X,
  Stethoscope,
  UserCheck,
  ShieldAlert,
  Mail,
  Phone,
  Key,
  Calendar,
  Clock,
  Shield,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Award,
  Layers,
  Archive,
  Pencil,
} from "lucide-react";
import clsx from "clsx";

interface StaffProfileModalProps {
  staff: StaffResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (staff: StaffResponse) => void;
  onStatusToggle?: (staff: StaffResponse) => void;
  onArchiveToggle?: (staff: StaffResponse) => void;
  onDeletePermanent?: (staff: StaffResponse) => void;
}

export default function StaffProfileModal({
  staff,
  isOpen,
  onClose,
  onEdit,
  onStatusToggle,
  onArchiveToggle,
  onDeletePermanent,
}: StaffProfileModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !staff) return null;

  const isDoc = staff.role === "PRACTITIONER";
  const isAssistant = staff.role === "MEDICAL_ASSISTANT";
  const isAdmin = staff.role === "ADMIN";
  const isActive = staff.active ?? staff.enabled;
  const isArchived = Boolean(staff.archived);

  function copyToClipboard(text: string, type: "id" | "email") {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="card relative w-full max-w-2xl border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-obsidian-900/95 p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-5">
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-bold shadow-subtle",
                isDoc && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-brand/40 dark:bg-brand/10 dark:text-brand",
                isAssistant && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-400",
                isAdmin && "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-400"
              )}
            >
              {isDoc && <Stethoscope className="h-7 w-7" />}
              {isAssistant && <UserCheck className="h-7 w-7" />}
              {isAdmin && <ShieldAlert className="h-7 w-7" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {isDoc ? "Dr. " : ""}
                  {staff.firstName} {staff.lastName}
                </h2>
                {isArchived ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400">
                    <Archive className="h-3 w-3" /> In Trash
                  </span>
                ) : (
                  <span className={clsx(isActive ? "badge-active" : "badge-inactive", "whitespace-nowrap inline-flex items-center gap-1.5 shrink-0")}>
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        isActive ? "bg-emerald-500 dark:bg-brand animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"
                      )}
                    />
                    <span className="whitespace-nowrap">{isActive ? "Active Duty" : "Disabled"}</span>
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                <span className="uppercase text-emerald-700 dark:text-brand font-semibold">
                  {staff.role.replace("_", " ")}
                </span>
                <span>•</span>
                <span>ID: {staff.id.slice(0, 12)}…</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && !isArchived && (
              <button
                onClick={() => onEdit(staff)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-white transition"
                title="Edit Profile"
              >
                <Pencil className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300 transition"
              title="Close dossier"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">
          {/* Main Attributes Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Email card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-obsidian-850/60 p-3.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" /> Email Address
                </span>
                {staff.email && (
                  <button
                    onClick={() => copyToClipboard(staff.email, "email")}
                    className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition font-mono"
                    title="Copy email"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600 dark:text-brand" />
                        <span className="text-emerald-700 dark:text-brand">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </span>
              <p className="mt-1.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate">
                {staff.email || "No email assigned"}
              </p>
            </div>

            {/* Phone card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-obsidian-850/60 p-3.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Phone Contact
              </span>
              <p className="mt-1.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                {staff.phone || "No phone registered"}
              </p>
            </div>

            {/* Unique User UUID */}
            <div className="sm:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-obsidian-850/60 p-3.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Staff Identifier (UUID)
                </span>
                <button
                  onClick={() => copyToClipboard(staff.id, "id")}
                  className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition font-mono"
                  title="Copy full UUID"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600 dark:text-brand" />
                      <span className="text-emerald-700 dark:text-brand">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </span>
              <p className="mt-1.5 font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
                {staff.id}
              </p>
            </div>
          </div>

          {/* Practitioner Clinical Accreditation Details */}
          {isDoc && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-brand/20 dark:bg-brand/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 dark:text-brand flex items-center gap-1.5 font-semibold">
                  <Award className="h-4 w-4" /> Clinical Practice Details
                </span>
                <Link
                  href={`/admin/staff/${staff.id}/working-hours`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 font-mono text-[11px] text-emerald-800 hover:bg-emerald-50 dark:border-brand/30 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20 transition shadow-subtle"
                >
                  <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                  <span>Configure Shift Matrix</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-white p-3 dark:border-white/[0.06] dark:bg-obsidian-900/80 shadow-subtle">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Medical License Number
                  </span>
                  <p className="mt-1 font-mono text-xs font-semibold text-zinc-900 dark:text-white tracking-wider">
                    {staff.licenseNumber || "Unspecified"}
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-white p-3 dark:border-white/[0.06] dark:bg-obsidian-900/80 shadow-subtle">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Clinical Specialty
                  </span>
                  <p className="mt-1 font-mono text-xs font-semibold text-emerald-700 dark:text-brand">
                    {staff.specialty || "General Practice"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security & Access Clearance Badges */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-zinc-400" /> Granted Clearances & Roles
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {staff.roles && staff.roles.length > 0 ? (
                staff.roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-700 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300"
                  >
                    <Layers className="h-3 w-3 text-emerald-600 dark:text-brand" />
                    <span>{r}</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-700 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300">
                  <Layers className="h-3 w-3 text-emerald-600 dark:text-brand" />
                  <span>ROLE_{staff.role}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Operations Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 dark:border-white/[0.08] pt-5">
          {/* Left Action: Toggle Active / Restore */}
          <div className="flex items-center gap-2">
            {!isArchived ? (
              <>
                {onStatusToggle && (
                  <button
                    type="button"
                    onClick={() => {
                      onStatusToggle(staff);
                    }}
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs transition",
                      isActive
                        ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-obsidian-850 dark:text-zinc-400 dark:hover:text-white"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-brand/30 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20 shadow-subtle"
                    )}
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-brand" />
                        <span>Suspend / Disable Account</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        <span>Authorize / Enable Account</span>
                      </>
                    )}
                  </button>
                )}

                {onArchiveToggle && (
                  <button
                    type="button"
                    onClick={() => {
                      onArchiveToggle(staff);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 font-mono text-xs text-red-600 hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-950/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Move to Trash</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {onArchiveToggle && (
                  <button
                    type="button"
                    onClick={() => {
                      onArchiveToggle(staff);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-700 hover:bg-emerald-100 dark:border-brand/30 dark:bg-brand/10 dark:text-brand dark:hover:bg-brand/20 transition shadow-subtle"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore Account</span>
                  </button>
                )}

                {onDeletePermanent && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePermanent(staff);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-200 transition shadow-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Expunge Permanently</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Action: Edit & Close */}
          <div className="flex items-center gap-2">
            {onEdit && !isArchived && (
              <button
                type="button"
                onClick={() => onEdit(staff)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 font-mono text-xs text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-white transition"
              >
                <Pencil className="h-3.5 w-3.5 text-emerald-600 dark:text-brand" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
