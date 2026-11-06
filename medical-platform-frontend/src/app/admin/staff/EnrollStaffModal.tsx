"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createStaff, adminListLookups } from "@/services/admin.service";
import type { CreateStaffRequest, Role, StaffResponse } from "@/types/api";
import {
  X,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  KeyRound,
  User,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";

const schema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(254),
    temporaryPassword: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128),
    role: z.enum(["PRACTITIONER", "MEDICAL_ASSISTANT", "ADMIN"] as const, {
      message: "Select a role",
    }),
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
    phone: z.string().max(32).optional(),
    licenseNumber: z.string().max(64).optional(),
    specialtyCode: z.string().max(64).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "PRACTITIONER" && (!data.licenseNumber || !data.licenseNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for practitioners",
        path: ["licenseNumber"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const ROLES = [
  {
    id: "PRACTITIONER",
    label: "Practitioner",
    desc: "Licensed clinical doctor or physician",
    icon: Stethoscope,
  },
  {
    id: "MEDICAL_ASSISTANT",
    label: "Assistant",
    desc: "Clinical & triage support personnel",
    icon: UserCheck,
  },
  {
    id: "ADMIN",
    label: "Administrator",
    desc: "Full operational access",
    icon: ShieldAlert,
  },
] as const;

const DEFAULT_SPECIALTIES = [
  { code: "GENERAL_PRACTICE", label: "General practice" },
  { code: "CARDIOLOGY", label: "Cardiology" },
  { code: "DERMATOLOGY", label: "Dermatology" },
  { code: "PEDIATRICS", label: "Pediatrics" },
  { code: "RADIOLOGY", label: "Radiology" },
];

interface EnrollStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}

export default function EnrollStaffModal({
  isOpen,
  onClose,
  onEnrolled,
}: EnrollStaffModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [specialties, setSpecialties] = useState(DEFAULT_SPECIALTIES);
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "PRACTITIONER", specialtyCode: "GENERAL_PRACTICE" },
  });

  const selectedRole = watch("role");
  const isPractitioner = selectedRole === "PRACTITIONER";
  const selectedSpecialty = specialties.find((s) => s.code === watch("specialtyCode"));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setSuccess(false);
      setSpecialtyOpen(false);
      reset({ role: "PRACTITIONER", specialtyCode: "GENERAL_PRACTICE" });
      adminListLookups("SPECIALTY")
        .then((data) => {
          if (data && data.length > 0) {
            setSpecialties(data.map((d) => ({ code: d.code, label: d.label })));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, reset]);

  if (!isOpen || !mounted) return null;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const payload: CreateStaffRequest = {
        email: values.email.trim(),
        temporaryPassword: values.temporaryPassword,
        role: values.role as Role,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || undefined,
        licenseNumber: isPractitioner ? values.licenseNumber?.trim() || undefined : undefined,
        specialtyCode: isPractitioner ? values.specialtyCode?.trim() || undefined : undefined,
      };

      await createStaff(payload);
      setSuccess(true);
      setTimeout(() => {
        onEnrolled();
        onClose();
      }, 1000);
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

      let msg = "Failed to enroll staff member into registry.";
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

  return createPortal(
    (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="card relative my-4 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto border-zinc-200 bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-obsidian-900/95 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-subtle dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
              <Stethoscope className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                Enroll Staff
              </h2>
              <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Practice Registration & Account Setup
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
              Staff Member Enrolled!
            </h3>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Synchronizing with active personnel directory…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
            {/* Role selector */}
            <div>
              <label className="label">Assignment Role</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ROLES.map(({ id, label, desc, icon: Icon }) => {
                  const isSelected = selectedRole === id;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setValue("role", id, { shouldValidate: true })}
                      className={clsx(
                        "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all duration-200",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/80 shadow-subtle dark:border-brand dark:bg-brand/10"
                          : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 hover:bg-zinc-100/70 dark:border-white/[0.08] dark:bg-obsidian-850/60 dark:hover:border-white/[0.16] dark:hover:bg-obsidian-800"
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          className={clsx(
                            "h-4 w-4",
                            isSelected
                              ? "text-emerald-600 dark:text-brand"
                              : "text-zinc-400 dark:text-zinc-400"
                          )}
                        />
                        <span className={clsx("text-xs font-semibold", isSelected ? "text-emerald-950 dark:text-white" : "text-zinc-800 dark:text-zinc-300")}>
                          {label}
                        </span>
                      </div>
                      <span className="hidden text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400 sm:block">
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
            </div>

            {/* Identity Info */}
            <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
                <User className="h-3 w-3 text-emerald-600 dark:text-brand" /> Personal Information
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="input"
                    placeholder="Eleanor"
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
                    placeholder="Vance"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="e.vance@clinic.local"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Phone (Optional)</label>
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

            {/* Credentials */}
            <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
                <KeyRound className="h-3 w-3 text-emerald-600 dark:text-brand" /> Initial Credentials
              </span>

              <div>
                <label className="label flex items-center justify-between">
                  <span>Temporary Password *</span>
                  <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[10px]">MIN 10 CHARACTERS</span>
                </label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  {...register("temporaryPassword")}
                />
                {errors.temporaryPassword && (
                  <p className="form-error">{errors.temporaryPassword.message}</p>
                )}
                <p className="mt-1 hidden font-mono text-[10px] text-zinc-500 dark:text-zinc-400 sm:block">
                  Password change will be prompted upon primary authentication.
                </p>
              </div>
            </div>

            {/* Practitioner-only accreditation fields */}
            {isPractitioner && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 backdrop-blur-sm dark:border-brand/20 dark:bg-brand/5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 dark:text-brand flex items-center gap-1.5 font-semibold">
                  <Sparkles className="h-3 w-3" /> Clinical Accreditation
                </span>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <input type="hidden" {...register("specialtyCode")} />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSpecialtyOpen((open) => !open)}
                        className="input flex items-center justify-between text-left font-mono text-xs"
                        aria-haspopup="listbox"
                        aria-expanded={specialtyOpen}
                      >
                        <span className={selectedSpecialty ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500"}>
                          {selectedSpecialty
                            ? `${selectedSpecialty.label} (${selectedSpecialty.code})`
                            : "None / Unspecified"}
                        </span>
                        <ChevronDown className={clsx("h-4 w-4 text-zinc-400 transition-transform", specialtyOpen && "rotate-180")} />
                      </button>
                      {specialtyOpen && (
                        <div
                          className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/[0.12] dark:bg-obsidian-850"
                          role="listbox"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setValue("specialtyCode", "", { shouldValidate: true });
                              setSpecialtyOpen(false);
                            }}
                            className={clsx(
                              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition",
                              !selectedSpecialty
                                ? "bg-emerald-50 text-emerald-800 dark:bg-brand/15 dark:text-brand"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                            )}
                          >
                            <span>None / Unspecified</span>
                            {!selectedSpecialty && <Check className="h-3.5 w-3.5" />}
                          </button>
                          {specialties.map((specialty) => (
                            <button
                              type="button"
                              key={specialty.code}
                              onClick={() => {
                                setValue("specialtyCode", specialty.code, { shouldValidate: true });
                                setSpecialtyOpen(false);
                              }}
                              className={clsx(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition",
                                selectedSpecialty?.code === specialty.code
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-brand/15 dark:text-brand"
                                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                              )}
                            >
                              <span>
                                <span className="block text-xs">{specialty.label}</span>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">{specialty.code}</span>
                              </span>
                              {selectedSpecialty?.code === specialty.code && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {serverError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 font-mono text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
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
                {isSubmitting ? "Enrolling…" : "Confirm & Enroll"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    ),
    document.body
  );
}
