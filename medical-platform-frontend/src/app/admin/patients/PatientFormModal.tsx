"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminListLookups, createPatient, updatePatient } from "@/services/admin.service";
import type { CreatePatientRequest, PatientResponse, UpdatePatientRequest } from "@/types/api";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  KeyRound,
  Pencil,
  ShieldPlus,
  User,
  UserPlus,
  X,
} from "lucide-react";
import clsx from "clsx";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(254),
  temporaryPassword: z.string().optional(),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string().max(32).optional(),
  nationalId: z.string().max(64).optional(),
  address: z.string().max(255).optional(),
  emergencyContactName: z.string().max(160).optional(),
  emergencyContactPhone: z.string().max(32).optional(),
  insuranceProvider: z.string().max(120).optional(),
  insuranceNumber: z.string().max(64).optional(),
  genderCode: z.string().max(64).optional(),
  bloodTypeCode: z.string().max(64).optional(),
});

type Values = z.infer<typeof schema>;
type Lookup = { code: string; label: string };

const DEFAULT_GENDERS: Lookup[] = [
  { code: "FEMALE", label: "Female" },
  { code: "MALE", label: "Male" },
  { code: "NON_BINARY", label: "Non-binary" },
  { code: "OTHER", label: "Other" },
];

const DEFAULT_BLOOD_TYPES: Lookup[] = [
  { code: "A_POSITIVE", label: "A positive (A+)" },
  { code: "A_NEGATIVE", label: "A negative (A-)" },
  { code: "B_POSITIVE", label: "B positive (B+)" },
  { code: "B_NEGATIVE", label: "B negative (B-)" },
  { code: "AB_POSITIVE", label: "AB positive (AB+)" },
  { code: "AB_NEGATIVE", label: "AB negative (AB-)" },
  { code: "O_POSITIVE", label: "O positive (O+)" },
  { code: "O_NEGATIVE", label: "O negative (O-)" },
];

export default function PatientFormModal({
  patient,
  isOpen,
  onClose,
  onSaved,
}: {
  patient: PatientResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (patient: PatientResponse) => void;
}) {
  const editing = Boolean(patient);
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [genders, setGenders] = useState(DEFAULT_GENDERS);
  const [bloodTypes, setBloodTypes] = useState(DEFAULT_BLOOD_TYPES);
  const [openLookup, setOpenLookup] = useState<"gender" | "bloodType" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const genderCode = watch("genderCode");
  const bloodTypeCode = watch("bloodTypeCode");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    setSuccess(false);
    setOpenLookup(null);
    reset(patient ? {
      email: patient.email,
      temporaryPassword: "",
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone ?? "",
      nationalId: patient.nationalId ?? "",
      address: patient.address ?? "",
      emergencyContactName: patient.emergencyContactName ?? "",
      emergencyContactPhone: patient.emergencyContactPhone ?? "",
      insuranceProvider: patient.insuranceProvider ?? "",
      insuranceNumber: patient.insuranceNumber ?? "",
      genderCode: patient.gender ?? "",
      bloodTypeCode: patient.bloodType ?? "",
    } : {
      email: "", temporaryPassword: "", firstName: "", lastName: "", dateOfBirth: "",
      phone: "", nationalId: "", address: "", emergencyContactName: "",
      emergencyContactPhone: "", insuranceProvider: "", insuranceNumber: "",
      genderCode: "", bloodTypeCode: "",
    });

    Promise.all([adminListLookups("GENDER"), adminListLookups("BLOOD_TYPE")])
      .then(([genderValues, bloodValues]) => {
        if (genderValues.length) setGenders(genderValues);
        if (bloodValues.length) setBloodTypes(bloodValues);
      })
      .catch(() => {
        // Defaults keep the form usable when optional lookup data is unavailable.
      });
  }, [isOpen, patient, reset]);

  if (!isOpen || !mounted) return null;

  async function submit(values: Values) {
    setServerError(null);
    if (!editing && (!values.temporaryPassword || values.temporaryPassword.length < 10)) {
      setServerError("Use a temporary password with at least 10 characters.");
      return;
    }

    try {
      const clean = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ])
      ) as Values;
      const saved = editing
        ? await updatePatient(patient!.id, clean as UpdatePatientRequest)
        : await createPatient(clean as CreatePatientRequest);
      setSuccess(true);
      setTimeout(() => {
        onSaved(saved);
        onClose();
      }, 700);
    } catch (err) {
      const data = (err as {
        response?: { data?: { detail?: string; message?: string } };
      }).response?.data;
      setServerError(data?.detail ?? data?.message ?? "Unable to save patient record.");
    }
  }

  function lookupField(
    name: "genderCode" | "bloodTypeCode",
    label: string,
    options: Lookup[],
    value: string | undefined
  ) {
    const type = name === "genderCode" ? "gender" : "bloodType";
    const selected = options.find((option) => option.code === value);
    return (
      <div>
        <label className="label">{label}</label>
        <input type="hidden" {...register(name)} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenLookup((current) => current === type ? null : type)}
            className="input flex items-center justify-between text-left font-mono text-xs"
            aria-expanded={openLookup === type}
          >
            <span className={selected ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500"}>
              {selected ? `${selected.label} (${selected.code})` : "None / Unspecified"}
            </span>
            <ChevronDown className={clsx("h-4 w-4 text-zinc-400 transition-transform", openLookup === type && "rotate-180")} />
          </button>
          {openLookup === type && (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/[0.12] dark:bg-obsidian-850">
              <button
                type="button"
                onClick={() => { setValue(name, "", { shouldValidate: true }); setOpenLookup(null); }}
                className={clsx("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs", !selected ? "bg-emerald-50 text-emerald-800 dark:bg-brand/15 dark:text-brand" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]")}
              >
                None / Unspecified {!selected && <Check className="h-3.5 w-3.5" />}
              </button>
              {options.map((option) => (
                <button
                  type="button"
                  key={option.code}
                  onClick={() => { setValue(name, option.code, { shouldValidate: true }); setOpenLookup(null); }}
                  className={clsx("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left", selected?.code === option.code ? "bg-emerald-50 text-emerald-800 dark:bg-brand/15 dark:text-brand" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]")}
                >
                  <span><span className="block text-xs">{option.label}</span><span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">{option.code}</span></span>
                  {selected?.code === option.code && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function field(name: keyof Values, label: string, type = "text", placeholder?: string) {
    return (
      <div>
        <label className="label">{label}</label>
        <input type={type} placeholder={placeholder} className="input" {...register(name)} />
        {errors[name] && <p className="form-error">{errors[name]?.message}</p>}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-900/40 p-4 backdrop-blur-md dark:bg-obsidian-950/85">
      <div className="card relative my-4 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto border-zinc-200 bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-obsidian-900/95 sm:p-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-subtle dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
              {editing ? <Pencil className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">{editing ? "Edit Patient" : "Enroll Patient"}</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Patient Registration & Account Setup</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-glow dark:border-brand/40 dark:bg-brand/10 dark:text-brand"><CheckCircle2 className="h-8 w-8 animate-bounce" /></div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Patient Saved!</h3>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">Synchronizing with patient directory…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submit)} noValidate className="mt-4 space-y-4">
            <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"><User className="h-3 w-3 text-emerald-600 dark:text-brand" /> Personal Information</span>
              <div className="grid grid-cols-2 gap-3">{field("firstName", "First Name *", "text", "Eleanor")}{field("lastName", "Last Name *", "text", "Vance")}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field("email", "Email Address *", "email", "e.vance@clinic.local")}{field("phone", "Phone (Optional)", "tel", "+1 555 019 2834")}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field("dateOfBirth", "Date of Birth *", "date")}{field("nationalId", "National ID", "text", "National identifier")}</div>
            </div>

            {!editing && (
              <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"><KeyRound className="h-3 w-3 text-emerald-600 dark:text-brand" /> Initial Credentials</span>
                {field("temporaryPassword", "Temporary Password *", "password", "••••••••••••")}
                <p className="hidden font-mono text-[10px] text-zinc-500 dark:text-zinc-400 sm:block">Password change will be prompted upon primary authentication.</p>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 backdrop-blur-sm dark:border-brand/20 dark:bg-brand/5">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-brand"><HeartPulse className="h-3 w-3" /> Demographics & Clinical Identity</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{lookupField("genderCode", "Gender", genders, genderCode)}{lookupField("bloodTypeCode", "Blood Type", bloodTypes, bloodTypeCode)}</div>
            </div>

            <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"><ShieldPlus className="h-3 w-3 text-emerald-600 dark:text-brand" /> Contact & Coverage</span>
              <div className="grid grid-cols-1 gap-3">{field("address", "Address", "text", "Street address")}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field("emergencyContactName", "Emergency Contact")}{field("emergencyContactPhone", "Emergency Phone", "tel")}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field("insuranceProvider", "Insurance Provider")}{field("insuranceNumber", "Insurance Number")}</div>
            </div>

            {serverError && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 font-mono text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400"><AlertCircle className="h-4 w-4 shrink-0" /><span>{serverError}</span></div>}

            <div className="flex items-center justify-end gap-3 border-t border-zinc-200/80 pt-3 dark:border-white/[0.06]">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? "Saving…" : editing ? "Save Changes" : "Confirm & Enroll"}</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
