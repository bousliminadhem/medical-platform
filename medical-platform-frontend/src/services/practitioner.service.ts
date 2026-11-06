import api from "@/lib/api-client";
import type {
  PractitionerResponse,
  WorkingHoursRequest,
  WorkingHoursResponse,
  TimeOffRequest,
  SlotResponse,
  AppointmentResponse,
  PatientResponse,
} from "@/types/api";

/**
 * GET /api/practitioners?all=true
 * Lists practitioners. Defaults to all (active + inactive) for admin directory view.
 */
export async function listPractitioners(all: boolean = true): Promise<PractitionerResponse[]> {
  const { data } = await api.get<PractitionerResponse[]>("/api/practitioners", {
    params: { all },
  });
  return data;
}

/**
 * GET /api/practitioners/{id}/working-hours
 * Returns the weekly working hours schedule for a given practitioner.
 */
export async function getWorkingHours(
  id: string
): Promise<WorkingHoursResponse[]> {
  const { data } = await api.get<WorkingHoursResponse[]>(
    `/api/practitioners/${id}/working-hours`
  );
  return data;
}

/**
 * PUT /api/practitioners/{id}/working-hours
 * Creates or replaces a single day's working hours entry.
 */
export async function setWorkingHours(
  id: string,
  body: WorkingHoursRequest
): Promise<WorkingHoursResponse> {
  const { data } = await api.put<WorkingHoursResponse>(
    `/api/practitioners/${id}/working-hours`,
    body
  );
  return data;
}

/**
 * PATCH /api/practitioners/{id}/active/{active}
 * Toggles a practitioner's active/inactive state.
 */
export async function setPractitionerActive(
  id: string,
  active: boolean
): Promise<PractitionerResponse> {
  const { data } = await api.patch<PractitionerResponse>(
    `/api/practitioners/${id}/active/${active}`
  );
  return data;
}

/**
 * POST /api/practitioners/{id}/time-off
 * Books a time-off period for a practitioner.
 */
export async function requestTimeOff(
  id: string,
  body: TimeOffRequest
): Promise<void> {
  await api.post(`/api/practitioners/${id}/time-off`, body);
}

/**
 * GET /api/practitioners/{id}/slots?date=YYYY-MM-DD
 * Returns available booking slots for a given date.
 */
export async function getPractitionerSlots(
  id: string,
  date: string
): Promise<SlotResponse[]> {
  const { data } = await api.get<SlotResponse[]>(
    `/api/practitioners/${id}/slots`,
    { params: { date } }
  );
  return data;
}

export async function getAgenda(
  from: string,
  to: string,
  practitionerId?: string
): Promise<AppointmentResponse[]> {
  const { data } = await api.get<AppointmentResponse[]>("/api/appointments", {
    params: { from, to, ...(practitionerId ? { practitionerId } : {}) },
  });
  return data;
}

export async function searchPatients(query = ""): Promise<PatientResponse[]> {
  const { data } = await api.get<{ content: PatientResponse[] }>("/api/patients", {
    params: { q: query, page: 0, size: 50 },
  });
  return data.content;
}
