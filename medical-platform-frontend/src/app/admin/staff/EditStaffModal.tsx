"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateStaff, adminListLookups } from "@/services/admin.service";
import type { StaffResponse, UpdateStaffRequest } from "@/types/api";
import {
  X,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  User,
  Sparkles,
  Pencil,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";

const DEFAULT_SPECIALTIES = [
  { code: "GENERAL_PRACTICE", label: "General practice" },
  { code: "CARDIOLOGY", label: "Cardiology" },
  { code: "DERMATOLOGY", label: "Dermatology" },
  { code: "PEDIATRICS", label: "Pediatrics" },
  { code: "RADIOLOGY", label: "Radiology" },
];

interface EditStaffModalProps {
  staff: StaffResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: StaffResponse) => void;
}

export default function EditStaffModal({
  staff,
  isOpen,
  onClose,
  onUpdated,
}: EditStaffModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [specialties, setSpecialties] = useState(DEFAULT_SPECIALTIES);

  const isPractitioner = staff?.role === "PRACTITIONER";
  const isAssistant = staff?.role === "MEDICAL_ASSISTANT";
  const isAdmin = staff?.role === "ADMIN";

  // Dynamic schema based on staff clearance
  const schema = useMemo(() => {
    return z.object({
      email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address")
        .max(254),
      firstName: z.string().trim().min(1, "First name is required").max(80),
      lastName: z.string().trim().min(1, "Last name is required").max(80),
      phone: z.string().max(32).optional().or(z.literal("")),
      licenseNumber: isPractitioner
        ? z.string().trim().min(1, "License number is required for practitioners").max(64)
        : z.string().max(64).optional().or(z.literal("")),
      specialtyCode: z.string().max(64).optional().or(z.literal("")),
    });
  }, [isPractitioner]);

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      licenseNumber: "",
      specialtyCode: "GENERAL_PRACTICE",
    },
  });

  useEffect(() => {
    if (isOpen && staff) {
      setServerError(null);
      setSuccess(false);

      // Determine matching specialty code from code or label
      const currentSpecialty = specialties.find(
        (s) =>
          (staff.specialtyCode && s.code.toUpperCase() === staff.specialtyCode.toUpperCase()) ||
          (staff.specialty && s.label.toLowerCase() === staff.specialty.toLowerCase()) ||
          (staff.specialty && s.code.toUpperCase() === staff.specialty.toUpperCase())
      );
      const initialCode = currentSpecialty?.code || staff.specialtyCode || "GENERAL_PRACTICE";

      // Pre-fill form values with current staff record
      reset({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phone: staff.phone || "",
        licenseNumber: isPractitioner ? staff.licenseNumber || "" : "",
        specialtyCode: initialCode,
      });

      // Load active specialties from lookup
      adminListLookups("SPECIALTY")
        .then((data) => {
          if (data && data.length > 0) {
            const mapped = data.map((d) => ({ code: d.code, label: d.label }));
            setSpecialties(mapped);
            const reMatched = mapped.find(
              (s) =>
                (staff.specialtyCode && s.code.toUpperCase() === staff.specialtyCode.toUpperCase()) ||
                (staff.specialty && s.label.toLowerCase() === staff.specialty.toLowerCase()) ||
                (staff.specialty && s.code.toUpperCase() === staff.specialty.toUpperCase())
            );
            if (reMatched) {
              setValue("specialtyCode", reMatched.code);
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, staff?.id]);

  if (!isOpen || !staff) return null;

  async function onSubmit(values: FormValues) {
    if (!staff) return;
    setServerError(null);

    if (isPractitioner && (!values.licenseNumber || !values.licenseNumber.trim())) {
      setServerError("License number is required for practitioners.");
      return;
    }

    try {
      const payload: UpdateStaffRequest = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
        licenseNumber: isPractitioner && values.licenseNumber?.trim() ? values.licenseNumber.trim() : undefined,
        specialtyCode: isPractitioner && values.specialtyCode?.trim() ? values.specialtyCode.trim() : undefined,
      };

      const updated = await updateStaff(staff.id, payload);
      setSuccess(true);
      setTimeout(() => {
        onUpdated(updated);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const errRes = (err as {
        response?: {
          data?: {
            detail?: string;
            message?: string;
            errors?: Record<string, string>;
            title?: string;
          };
        };
      })?.response?.data;

      let msg = "Failed to update staff record.";
      if (errRes?.detail) {
        msg = errRes.detail;
      } else if (errRes?.message) {
        msg = errRes.message;
      } else if (errRes?.errors) {
        msg = Object.entries(errRes.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } else if (errRes?.title) {
        msg = errRes.title;
      }
      setServerError(msg);
    }
  }

  const onFormSubmit = handleSubmit(
    async (values) => {
      await onSubmit(values);
    },
    (validationErrors) => {
      console.error("Form validation errors:", validationErrors);
      const errMessages = Object.entries(validationErrors)
        .map(([field, err]) => `${field}: ${err?.message || "Invalid value"}`)
        .join(", ");
      setServerError(`Please resolve the form issues: ${errMessages}`);
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="card relative w-full max-w-xl border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-obsidian-900/95 p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-subtle">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                Edit Staff Profile
              </h2>
              <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Staff Record // {staff.id.slice(0, 8)}…
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-brand/40 dark:bg-brand/10 dark:text-brand shadow-glow">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
              Profile Updated Successfully!
            </h3>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Synchronizing records with active directory…
            </p>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} noValidate className="mt-5 space-y-5">
            {/* Clearance Role Badge (Read-only security badge) */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-obsidian-850/60 p-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-lg border",
                    isPractitioner && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-brand/30 dark:bg-brand/10 dark:text-brand",
                    isAssistant && "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400",
                    isAdmin && "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400"
                  )}
                >
                  {isPractitioner && <Stethoscope className="h-4 w-4" />}
                  {isAssistant && <UserCheck className="h-4 w-4" />}
                  {isAdmin && <ShieldAlert className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Clinical Role
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {staff.role.replace("_", " ")}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-600 border border-zinc-300 dark:bg-white/[0.06] dark:text-zinc-400 dark:border-white/[0.08]">
                Role Assigned
              </span>
            </div>

            {/* Identity Information */}
            <div className="space-y-3.5 border-t border-zinc-200/80 dark:border-white/[0.06] pt-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
                <User className="h-3 w-3 text-emerald-600 dark:text-brand" /> Identity Details
              </span>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="input"
                    placeholder="First Name"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    className="input"
                    placeholder="Last Name"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="label flex items-center gap-1">
                    <Mail className="h-3 w-3 text-zinc-400" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="staff@clinic.local"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    <span>Phone Contact</span>
                  </label>
                  <input
                    type="tel"
                    className="input font-mono text-xs"
                    placeholder="+1 555 019 2834"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Practitioner-only accreditation fields */}
            {isPractitioner && (
              <div className="space-y-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-brand/20 dark:bg-brand/5 p-4 backdrop-blur-sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 dark:text-brand flex items-center gap-1.5 font-semibold">
                  <Sparkles className="h-3 w-3" /> Clinical Accreditation
                </span>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="label">License Number *</label>
                    <input
                      className="input font-mono text-xs uppercase"
                      placeholder="e.g. LIC-920482"
                      {...register("licenseNumber")}
                    />
                    {errors.licenseNumber && (
                      <p className="form-error">{errors.licenseNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Specialty Category</label>
                    <select
                      className="input font-mono text-xs"
                      {...register("specialtyCode")}
                    >
                      <option value="">None / Unspecified</option>
                      {specialties.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.label} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {serverError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 p-3 font-mono text-xs"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-200/80 dark:border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
