"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
  Stethoscope,
  Users,
  X,
  Check,
  Ban,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getAgenda, listPractitioners, getPractitionerSlots, searchPatients } from "@/services/practitioner.service";
import { bookAppointment, cancelAppointment, confirmAppointment, requestAppointment, rescheduleAppointment, updateAppointmentStatus } from "@/services/appointment.service";
import { openConsultation } from "@/services/consultation.service";
import type { AppointmentResponse, AppointmentStatus, PatientResponse, PractitionerResponse, SlotResponse } from "@/types/api";

type ViewMode = "DAY" | "WEEK";
const CLINIC_TIME_ZONE = "Africa/Tunis";

const STATUS_META: Record<AppointmentStatus, { label: string; tone: string; dot: string }> = {
  SCHEDULED: { label: "Pending confirmation", tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300", dot: "bg-amber-500" },
  CONFIRMED: { label: "Confirmed", tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand", dot: "bg-emerald-500" },
  IN_PROGRESS: { label: "In progress", tone: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300", dot: "bg-sky-500" },
  COMPLETED: { label: "Completed", tone: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/[0.1] dark:bg-obsidian-850 dark:text-zinc-300", dot: "bg-zinc-400" },
  CANCELLED: { label: "Cancelled", tone: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300", dot: "bg-red-500" },
  NO_SHOW: { label: "No-show", tone: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300", dot: "bg-purple-500" },
};

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AgendaPage() {
  const { user, isAdmin, isPractitioner, isMedicalAssistant, isPatient, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("DAY");
  const [practitionerId, setPractitionerId] = useState("");
  const [practitioners, setPractitioners] = useState<PractitionerResponse[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [availabilityPractitionerId, setAvailabilityPractitionerId] = useState("");
  const [availableSlots, setAvailableSlots] = useState<SlotResponse[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const range = useMemo(() => {
    const start = viewMode === "WEEK" ? startOfWeek(selectedDate) : selectedDate;
    const end = new Date(start);
    if (viewMode === "WEEK") end.setDate(end.getDate() + 6);
    return { from: dateKey(start), to: dateKey(end), start };
  }, [selectedDate, viewMode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agenda, staff] = await Promise.all([
        getAgenda(range.from, range.to, practitionerId || undefined),
        practitioners.length === 0 ? listPractitioners(false) : Promise.resolve(practitioners),
      ]);
      setAppointments(agenda);
      if (practitioners.length === 0) setPractitioners(staff);
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to synchronize the clinical agenda.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, practitioners, range.from, range.to, practitionerId]);

  useEffect(() => {
    if (isAdmin || isPractitioner || isMedicalAssistant || isPatient) load();
  }, [isAdmin, isPractitioner, isMedicalAssistant, isPatient, load]);

  const availabilityDate = dateKey(selectedDate);
  const availabilityId = isPractitioner
    ? user?.id || ""
    : availabilityPractitionerId || practitionerId;

  useEffect(() => {
    if (!availabilityId || viewMode !== "DAY") {
      setAvailableSlots([]);
      return;
    }
    setAvailabilityLoading(true);
    getPractitionerSlots(availabilityId, availabilityDate)
      .then(setAvailableSlots)
      .catch(() => setAvailableSlots([]))
      .finally(() => setAvailabilityLoading(false));
  }, [availabilityDate, availabilityId, viewMode]);

  const days = useMemo(() => Array.from({ length: viewMode === "WEEK" ? 7 : 1 }, (_, index) => {
    const day = new Date(range.start);
    day.setDate(day.getDate() + index);
    return day;
  }), [range.start, viewMode]);

  const stats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter((item) => item.status === "CONFIRMED").length,
    awaiting: appointments.filter((item) => item.status === "SCHEDULED").length,
    active: appointments.filter((item) => item.status === "IN_PROGRESS").length,
  }), [appointments]);

  function move(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta * (viewMode === "WEEK" ? 7 : 1));
    setSelectedDate(next);
  }

  if (authLoading) return <div className="p-10 text-center text-sm text-zinc-500">Checking authorization…</div>;
  if (!isAdmin && !isPractitioner && !isMedicalAssistant && !isPatient) return <div className="card p-10 text-center text-sm text-red-600">Authorized access is required.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-800 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Scheduling engine online
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Clinical Agenda</h1>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{isPatient ? "Your upcoming visits, appointment status, and care schedule." : isPractitioner ? "Your clinical schedule, patient flow, and visit status at a glance." : isMedicalAssistant ? "Coordinate visits, practitioner capacity, and today&apos;s patient flow." : "A live view of visits, practitioner capacity, and today&apos;s patient flow."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSelectedDate(new Date())} className="btn-secondary text-xs">Today</button>
          <div className="flex items-center rounded-xl border border-zinc-200 bg-white p-1 dark:border-white/[0.08] dark:bg-obsidian-900">
            {(["DAY", "WEEK"] as ViewMode[]).map((mode) => <button key={mode} onClick={() => setViewMode(mode)} className={clsx("rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider", viewMode === mode ? "bg-emerald-50 text-emerald-800 dark:bg-brand/15 dark:text-brand" : "text-zinc-500")}>{mode}</button>)}
          </div>
          <button onClick={load} disabled={loading} className="btn-secondary"><RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />Refresh</button>
          <button onClick={() => setBookingOpen(true)} className="btn-primary"><Plus className="h-3.5 w-3.5" />{isPatient ? "Request appointment" : "Book appointment"}</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total visits" value={stats.total} icon={<CalendarDays className="h-4 w-4 text-emerald-600 dark:text-brand" />} />
        <Metric label="Confirmed" value={stats.confirmed} icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} />
        <Metric label="Awaiting action" value={stats.awaiting} icon={<span className="h-2 w-2 rounded-full bg-amber-500" />} />
        <Metric label="In progress" value={stats.active} icon={<span className="h-2 w-2 rounded-full bg-sky-500" />} />
      </div>

      <div className="card flex flex-col gap-4 border-zinc-200/80 bg-white p-4 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="btn-secondary p-2" title="Previous period"><ChevronLeft className="h-4 w-4" /></button>
          <div className="min-w-44 text-center"><p className="font-semibold text-zinc-900 dark:text-white">{viewMode === "DAY" ? formatDay(selectedDate) : `${formatDay(range.start)} – ${formatDay(days[days.length - 1])}`}</p><p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{viewMode === "DAY" ? "Daily operations" : "Weekly operations"}</p></div>
          <button onClick={() => move(1)} className="btn-secondary p-2" title="Next period"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          {isAdmin && <select value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="input min-w-56 font-mono text-xs"><option value="">All practitioners</option>{practitioners.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.specialty || "General"}</option>)}</select>}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-400">{error}</div>}

      {viewMode === "DAY" && <AvailableSlotsPanel
        isPatient={isPatient}
        isPractitioner={isPractitioner}
        practitionerId={availabilityPractitionerId}
        practitioners={practitioners}
        selectedDate={selectedDate}
        slots={availableSlots}
        loading={availabilityLoading}
        onPractitionerChange={setAvailabilityPractitionerId}
        onBook={() => setBookingOpen(true)}
      />}

      <div className={clsx("grid gap-4", viewMode === "WEEK" ? "lg:grid-cols-2 xl:grid-cols-4" : "grid-cols-1")}>
        {days.map((day) => {
          const dayKey = dateKey(day);
          const dayAppointments = appointments.filter((item) => dateKey(new Date(item.startAt)) === dayKey).sort((a, b) => a.startAt.localeCompare(b.startAt));
          return <section key={dayKey} className="card overflow-hidden border-zinc-200/80 bg-white p-0 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
            <button type="button" onClick={() => { setSelectedDate(day); setViewMode("DAY"); }} className="flex w-full items-center justify-between border-b border-zinc-200/80 bg-zinc-50/80 px-5 py-4 text-left transition hover:bg-emerald-50/70 dark:border-white/[0.08] dark:bg-obsidian-850/50 dark:hover:bg-brand/5"><div><p className="font-semibold text-zinc-900 dark:text-white">{formatDay(day)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{dayAppointments.length} {dayAppointments.length === 1 ? "visit" : "visits"} · Open day view</p></div><CalendarDays className="h-4 w-4 text-emerald-600 dark:text-brand" /></button>
            <div className="space-y-2 p-3">{loading ? <div className="py-12 text-center"><RefreshCw className="mx-auto h-5 w-5 animate-spin text-brand" /></div> : dayAppointments.length ? dayAppointments.map((item) => <AppointmentCard key={item.id} appointment={item} onClick={() => setSelectedAppointment(item)} />) : <div className="py-12 text-center"><Clock3 className="mx-auto h-6 w-6 text-zinc-300 dark:text-zinc-600" /><p className="mt-2 text-xs text-zinc-500">No visits scheduled</p><p className="mt-1 font-mono text-[10px] text-zinc-400">Capacity available</p></div>}</div>
          </section>;
        })}
      </div>

      {selectedAppointment && <AppointmentDetails appointment={selectedAppointment} canManage={isAdmin || isPractitioner || isMedicalAssistant} canPatient={isPatient} canViewClinical={isPractitioner} onClose={() => setSelectedAppointment(null)} onUpdated={(updated) => { setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item)); setSelectedAppointment(updated); }} />}
      {bookingOpen && <BookingDialog initialDate={dateKey(selectedDate)} isPatient={isPatient} practitionerId={isPractitioner ? user?.id : undefined} practitioners={practitioners} onClose={() => setBookingOpen(false)} onCreated={(created) => { setAppointments((current) => [...current, created]); setBookingOpen(false); }} />}
    </div>
  );
}

function AvailableSlotsPanel({ isPatient, isPractitioner, practitionerId, practitioners, selectedDate, slots, loading, onPractitionerChange, onBook }: {
  isPatient: boolean;
  isPractitioner: boolean;
  practitionerId: string;
  practitioners: PractitionerResponse[];
  selectedDate: Date;
  slots: SlotResponse[];
  loading: boolean;
  onPractitionerChange: (value: string) => void;
  onBook: () => void;
}) {
  const selected = practitioners.find((item) => item.id === practitionerId);
  return <section className="card border-zinc-200/80 bg-white p-5 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Capacity finder</p><h2 className="mt-1 font-semibold text-zinc-900 dark:text-white">Available appointment slots</h2><p className="mt-1 text-xs text-zinc-500">{formatDay(selectedDate)} · Open slots exclude pending requests and confirmed visits.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {!isPractitioner && <select value={practitionerId} onChange={(event) => onPractitionerChange(event.target.value)} className="input min-w-56 text-xs"><option value="">Select practitioner</option>{practitioners.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.specialty || "General"}</option>)}</select>}
        {isPatient && <button onClick={onBook} className="btn-primary">{isPatient ? "Request a slot" : "Book slot"}</button>}
      </div>
    </div>
    {!isPractitioner && !practitionerId ? <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-xs text-zinc-500 dark:border-white/[0.12]">Choose a practitioner to see live availability.</div> : loading ? <div className="mt-4 py-6 text-center text-xs text-zinc-500"><RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin text-brand" />Loading availability…</div> : slots.length ? <div className="mt-4 flex flex-wrap gap-2">{slots.map((slot) => <button key={slot.start} onClick={onBook} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-[11px] text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">{formatTime(slot.start)} – {formatTime(slot.end)}</button>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-xs text-zinc-500 dark:border-white/[0.12]">No available slots for {selected ? `${selected.firstName} ${selected.lastName}` : "this practitioner"} on this day.</div>}
  </section>;
}

function BookingDialog({ initialDate, isPatient, practitionerId, practitioners, onClose, onCreated }: {
  initialDate: string;
  isPatient: boolean;
  practitionerId?: string;
  practitioners: PractitionerResponse[];
  onClose: () => void;
  onCreated: (appointment: AppointmentResponse) => void;
}) {
  const [selectedPractitioner, setSelectedPractitioner] = useState(practitionerId || "");
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPractitioner || !date) { setSlots([]); return; }
    setLoadingSlots(true);
    getPractitionerSlots(selectedPractitioner, date).then(setSlots).catch(() => setError("Unable to load available slots.")).finally(() => setLoadingSlots(false));
  }, [selectedPractitioner, date]);

  useEffect(() => {
    if (!isPatient) searchPatients().then(setPatients).catch(() => setError("Unable to load patients."));
  }, [isPatient]);

  async function submit() {
    if (!selectedPractitioner || !selectedSlot || (!isPatient && !patientId)) {
      setError("Select a practitioner, available slot, and patient.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const created = isPatient
        ? await requestAppointment({ practitionerId: selectedPractitioner, startAt: selectedSlot, reason: reason.trim() || undefined })
        : await bookAppointment({ patientId, practitionerId: selectedPractitioner, startAt: selectedSlot, reason: reason.trim() || undefined });
      onCreated(created);
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(data?.detail || data?.message || "Unable to create the appointment.");
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-md dark:bg-obsidian-950/85"><div className="card w-full max-w-xl border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-obsidian-900/95"><div className="flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-white/[0.08]"><div><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">{isPatient ? "Request a visit" : "Schedule a visit"}</p><h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">Book appointment</h2><p className="text-xs text-zinc-500">{isPatient ? "Your request will await clinical confirmation." : "This visit will be booked as confirmed."}</p></div><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs text-zinc-500 sm:col-span-2">Practitioner<select value={selectedPractitioner} onChange={(event) => { setSelectedPractitioner(event.target.value); setSelectedSlot(""); }} disabled={Boolean(practitionerId)} className="input mt-1 text-xs"><option value="">Select practitioner</option>{practitioners.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.specialty || "General"}</option>)}</select></label>{!isPatient && <label className="text-xs text-zinc-500 sm:col-span-2">Patient<select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="input mt-1 text-xs"><option value="">Select patient</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email}</option>)}</select></label>}<label className="text-xs text-zinc-500">Date<input type="date" min={dateKey(new Date())} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(""); }} className="input mt-1 text-xs" /></label><label className="text-xs text-zinc-500">Available slot<select value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)} disabled={loadingSlots || !selectedPractitioner} className="input mt-1 text-xs"><option value="">{loadingSlots ? "Loading slots…" : slots.length ? "Select a slot" : "No slots available"}</option>{slots.map((slot) => <option key={slot.start} value={slot.start}>{formatTime(slot.start)} – {formatTime(slot.end)}</option>)}</select></label><label className="text-xs text-zinc-500 sm:col-span-2">Reason (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} className="input mt-1 resize-none text-xs" placeholder="Reason for visit" /></label></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}<div className="mt-5 flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-white/[0.08]"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={submit} disabled={saving || loadingSlots} className="btn-primary">{saving ? "Booking…" : isPatient ? "Request appointment" : "Book appointment"}</button></div></div></div>;
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft dark:border-white/[0.08] dark:bg-obsidian-900/60"><div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}{icon}</div><p className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">{value}</p><span className="text-[10px] text-zinc-500">Agenda records</span></div>;
}

function AppointmentCard({ appointment, onClick }: { appointment: AppointmentResponse; onClick: () => void }) {
  const meta = STATUS_META[appointment.status];
  return <button onClick={onClick} className="group w-full rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-subtle dark:border-white/[0.07] dark:bg-obsidian-850/60 dark:hover:border-brand/30 dark:hover:bg-brand/5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 font-mono text-[10px] font-bold text-emerald-700 dark:border-brand/30 dark:bg-brand/10 dark:text-brand">{appointment.patientName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><p className="font-semibold text-zinc-800 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-brand">{appointment.patientName}</p><p className="font-mono text-[10px] text-zinc-500">{formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}</p></div></div><span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-wider", meta.tone)}><span className={clsx("h-1.5 w-1.5 rounded-full", meta.dot)} />{appointment.status.replaceAll("_", " ")}</span></div><div className="mt-3 flex items-center gap-1.5 border-t border-zinc-200/70 pt-2 font-mono text-[10px] text-zinc-500 dark:border-white/[0.06]"><Stethoscope className="h-3 w-3 text-emerald-600 dark:text-brand" />{appointment.practitionerName}<span className="ml-auto truncate">{appointment.reason || "Routine visit"}</span></div></button>;
}

function AppointmentDetails({ appointment, canManage, canPatient, canViewClinical, onClose, onUpdated }: { appointment: AppointmentResponse; canManage: boolean; canPatient: boolean; canViewClinical: boolean; onClose: () => void; onUpdated: (appointment: AppointmentResponse) => void }) {
  const meta = STATUS_META[appointment.status];
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [newStartAt, setNewStartAt] = useState(appointment.startAt.slice(0, 16));
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [actionError, setActionError] = useState<string | null>(null);
  async function run(action: () => Promise<AppointmentResponse>) {
    setBusy(true); setActionError(null);
    try { onUpdated(await action()); } catch (err) { const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data; setActionError(data?.detail || data?.message || "Unable to update this appointment."); } finally { setBusy(false); }
  }
  async function startConsultation() {
    setBusy(true);
    setActionError(null);
    try {
      const consultation = await openConsultation(appointment.id);
      window.location.href = `/practitioner/consultations/${consultation.id}`;
    } catch (err) {
      const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setActionError(data?.detail || data?.message || "Unable to open the consultation.");
      setBusy(false);
    }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-md dark:bg-obsidian-950/85"><div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-obsidian-900/95"><div className="flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-white/[0.08]"><div><p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-brand">Appointment dossier</p><h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">{appointment.patientName}</h2><p className="text-xs text-zinc-500">{appointment.practitionerName}</p></div><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid grid-cols-2 gap-4"><Detail label="Status"><span className={clsx("inline-flex rounded-full border px-2 py-1 font-mono text-[10px]", meta.tone)}>{meta.label}</span></Detail><Detail label="Visit time">{formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}</Detail><Detail label="Practitioner">{appointment.practitionerName}</Detail><Detail label="Reason">{appointment.reason || "Not specified"}</Detail>{appointment.cancelReason && <Detail label="Cancellation reason">{appointment.cancelReason}</Detail>}</div>
    {canViewClinical && appointment.status === "CONFIRMED" && <button disabled={busy} onClick={startConsultation} className="btn-primary mt-5 w-full justify-center"><Stethoscope className="h-3.5 w-3.5" />Open consultation</button>}
    {(canManage || canPatient) && appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && <div className="mt-5 space-y-3 border-t border-zinc-200 pt-4 dark:border-white/[0.08]"><p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Appointment actions</p>{canManage && appointment.status === "SCHEDULED" && <button disabled={busy} onClick={() => run(() => confirmAppointment(appointment.id))} className="btn-primary w-full justify-center"><Check className="h-3.5 w-3.5" />Confirm appointment</button>}<div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-zinc-500 sm:col-span-2">Move to<input type="datetime-local" value={newStartAt} onChange={(event) => setNewStartAt(event.target.value)} className="input mt-1 text-xs" /></label><button disabled={busy} onClick={() => run(() => rescheduleAppointment(appointment.id, { newStartAt: new Date(newStartAt).toISOString() }))} className="btn-secondary justify-center"><ArrowRightLeft className="h-3.5 w-3.5" />Reschedule</button><button disabled={busy || !reason.trim()} onClick={() => run(() => cancelAppointment(appointment.id, { reason: reason.trim() }))} className="btn-danger justify-center"><Ban className="h-3.5 w-3.5" />Cancel visit</button></div>{(canManage || canPatient) && <label className="block text-xs text-zinc-500">Cancellation reason<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} className="input mt-1 text-xs" placeholder="Required when cancelling" /></label>}{canManage && <div className="flex items-center gap-2"><select value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)} className="input flex-1 text-xs"><option value="CONFIRMED">Confirmed</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="NO_SHOW">No-show</option></select><button disabled={busy || status === appointment.status} onClick={() => run(() => updateAppointmentStatus(appointment.id, status))} className="btn-secondary"><ActivityIcon status={status} />Update status</button></div>}{canViewClinical && <Link href={`/practitioner/patients/${appointment.patientId}`} className="btn-secondary w-full justify-center">Open clinical record</Link>}{actionError && <p className="text-xs text-red-600 dark:text-red-400">{actionError}</p>}</div>}
    <div className="mt-5 flex justify-end border-t border-zinc-200 pt-4 dark:border-white/[0.08]"><button onClick={onClose} className="btn-secondary">Dismiss</button></div></div></div>;
}

function ActivityIcon({ status }: { status: AppointmentStatus }) {
  return status === "COMPLETED" ? <Check className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</p><div className="mt-1 text-xs text-zinc-800 dark:text-zinc-200">{children}</div></div>;
}
