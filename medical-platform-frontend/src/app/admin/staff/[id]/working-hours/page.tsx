"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getWorkingHours,
  setWorkingHours,
} from "@/services/practitioner.service";
import type { DayOfWeek, WorkingHoursResponse } from "@/types/api";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

// ─── Constants ────────────────────────────────────────────────────────────
const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

// ─── Validation schema ─────────────────────────────────────────────────────
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const schema = z
  .object({
    dayOfWeek: z.enum(DAYS as [DayOfWeek, ...DayOfWeek[]]),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .regex(TIME_RE, "Use HH:MM format"),
    endTime: z
      .string()
      .min(1, "End time is required")
      .regex(TIME_RE, "Use HH:MM format"),
    breakStart: z.union([
      z.string().regex(TIME_RE, "Use HH:MM format"),
      z.literal(""),
    ]).optional(),
    breakEnd: z.union([
      z.string().regex(TIME_RE, "Use HH:MM format"),
      z.literal(""),
    ]).optional(),
    slotMinutes: z
      .number()
      .min(5, "Min 5 min")
      .max(240, "Max 240 min")
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.startTime && v.endTime && v.startTime >= v.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
    const hasBreakStart = v.breakStart && v.breakStart !== "";
    const hasBreakEnd = v.breakEnd && v.breakEnd !== "";
    if (hasBreakStart !== hasBreakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both break start and end are required together",
        path: hasBreakStart ? ["breakEnd"] : ["breakStart"],
      });
    }
    if (hasBreakStart && hasBreakEnd && v.breakStart! >= v.breakEnd!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break end must be after break start",
        path: ["breakEnd"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

// ─── Working Hours Row ────────────────────────────────────────────────────
function WorkingHoursRow({
  day,
  entry,
  onEdit,
}: {
  day: DayOfWeek;
  entry?: WorkingHoursResponse;
  onEdit: (day: DayOfWeek) => void;
}) {
  return (
    <tr className="group border-b border-zinc-200/70 dark:border-white/[0.04] hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition">
      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            entry ? "bg-emerald-500 dark:bg-brand" : "bg-zinc-300 dark:bg-zinc-700"
          )}
        />
        <span>{DAY_LABELS[day]}</span>
      </td>

      {entry ? (
        <>
          <td className="px-6 py-4 font-mono text-xs text-emerald-700 dark:text-brand">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-brand/20 dark:bg-brand/5 dark:text-brand px-2.5 py-1">
              {entry.startTime?.slice(0, 5)} → {entry.endTime?.slice(0, 5)}
            </span>
          </td>
          <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {entry.breakStart && entry.breakEnd ? (
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-white/[0.06] dark:bg-obsidian-850 dark:text-zinc-400 px-2 py-0.5">
                {entry.breakStart.slice(0, 5)} – {entry.breakEnd.slice(0, 5)}
              </span>
            ) : (
              <span className="text-zinc-400 font-mono">—</span>
            )}
          </td>
          <td className="px-6 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
            {entry.slotMinutes ? (
              <span className="rounded-md bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-obsidian-850 dark:border-white/[0.06] dark:text-zinc-300 px-2 py-0.5">
                {entry.slotMinutes}m
              </span>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </td>
          <td className="px-6 py-4">
            <span className="badge-active">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-brand animate-pulse" />
              Active
            </span>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 text-xs font-mono text-zinc-400 dark:text-zinc-600" colSpan={3}>
            No active shift recorded
          </td>
          <td className="px-6 py-4">
            <span className="badge-inactive">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              Off Duty
            </span>
          </td>
        </>
      )}

      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onEdit(day)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 font-mono text-[11px] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-obsidian-850 dark:text-zinc-300 dark:hover:border-brand/40 dark:hover:text-brand transition"
        >
          <Edit3 className="h-3 w-3 text-emerald-600 dark:text-brand" />
          <span>{entry ? "Modify" : "Configure"}</span>
        </button>
      </td>
    </tr>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────
function WorkingHoursModal({
  practitionerId,
  day,
  existing,
  onClose,
  onSaved,
}: {
  practitionerId: string;
  day: DayOfWeek;
  existing?: WorkingHoursResponse;
  onClose: () => void;
  onSaved: (saved: WorkingHoursResponse) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dayOfWeek: day,
      startTime: existing?.startTime?.slice(0, 5) ?? "09:00",
      endTime: existing?.endTime?.slice(0, 5) ?? "17:00",
      breakStart: existing?.breakStart?.slice(0, 5) ?? "",
      breakEnd: existing?.breakEnd?.slice(0, 5) ?? "",
      slotMinutes: existing?.slotMinutes ?? 30,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const result = await setWorkingHours(practitionerId, {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        breakStart: values.breakStart || undefined,
        breakEnd: values.breakEnd || undefined,
        slotMinutes: values.slotMinutes,
      });
      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to commit shift hours.";
      setServerError(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-obsidian-950/80 backdrop-blur-md">
      <div className="card relative w-full max-w-lg border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-obsidian-900/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                {DAY_LABELS[day]} Schedule Configuration
              </h3>
              <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                Clinical Schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
          {/* Working period */}
          <div>
            <label className="label">Operational Shift (Start / End)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="time"
                  className="input font-mono text-xs"
                  {...register("startTime")}
                />
                {errors.startTime && (
                  <p className="form-error">{errors.startTime.message}</p>
                )}
              </div>
              <div>
                <input
                  type="time"
                  className="input font-mono text-xs"
                  {...register("endTime")}
                />
                {errors.endTime && (
                  <p className="form-error">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Break period */}
          <div>
            <label className="label flex items-center justify-between">
              <span>Recess / Break (Optional)</span>
              <span className="text-zinc-600 font-mono text-[10px]">BOTH OR NONE</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="time"
                  className="input font-mono text-xs"
                  placeholder="12:00"
                  {...register("breakStart")}
                />
                {errors.breakStart && (
                  <p className="form-error">{errors.breakStart.message}</p>
                )}
              </div>
              <div>
                <input
                  type="time"
                  className="input font-mono text-xs"
                  placeholder="13:00"
                  {...register("breakEnd")}
                />
                {errors.breakEnd && (
                  <p className="form-error">{errors.breakEnd.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Slot duration */}
          <div>
            <label className="label">Appointment Slot Duration (Minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                className="input w-32 font-mono text-xs"
                placeholder="30"
                {...register("slotMinutes", { valueAsNumber: true })}
              />
              <span className="font-mono text-xs text-zinc-500">
                Default: 30 min (5 – 240 range)
              </span>
            </div>
            {errors.slotMinutes && (
              <p className="form-error">{errors.slotMinutes.message}</p>
            )}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400 p-3 font-mono text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-zinc-200/80 dark:border-white/[0.06] pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? "Saving…" : "Save Working Hours"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function WorkingHoursPage() {
  const params = useParams();
  const practitionerId = params?.id as string;

  const [schedule, setSchedule] = useState<Record<string, WorkingHoursResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkingHours(practitionerId);
      const map: Record<string, WorkingHoursResponse> = {};
      data.forEach((entry) => {
        map[entry.dayOfWeek] = entry;
      });
      setSchedule(map);
    } catch {
      setError("Failed to retrieve practitioner shift matrix.");
    } finally {
      setLoading(false);
    }
  }, [practitionerId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  function handleSaved(saved: WorkingHoursResponse) {
    setSchedule((prev) => ({ ...prev, [saved.dayOfWeek]: saved }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Staff Directory</span>
        </Link>

        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin text-brand")} />
          <span>Refresh Schedule</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Practitioner Schedule & Availability
            </h1>
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            Practitioner ID: <span className="text-zinc-700 dark:text-zinc-300">{practitionerId}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-4 font-mono text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Schedule Table */}
      <div className="card overflow-hidden p-0 border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 shadow-soft">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand" />
            <p className="mt-3 font-mono text-xs text-zinc-500 uppercase tracking-widest">
              Fetching Schedule Matrix…
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/90 dark:border-white/[0.08] dark:bg-obsidian-850/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-3.5 w-40">Day</th>
                <th className="px-6 py-3.5">Working Hours</th>
                <th className="px-6 py-3.5">Break Interval</th>
                <th className="px-6 py-3.5">Slot Interval</th>
                <th className="px-6 py-3.5">Duty Status</th>
                <th className="px-6 py-3.5 text-right">Configure</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <WorkingHoursRow
                  key={day}
                  day={day}
                  entry={schedule[day]}
                  onEdit={setEditingDay}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingDay && (
        <WorkingHoursModal
          practitionerId={practitionerId}
          day={editingDay}
          existing={schedule[editingDay]}
          onClose={() => setEditingDay(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
