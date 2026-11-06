import api from "@/lib/api-client";
import type {
  HealthBackgroundRequest,
  HealthBackgroundResponse,
  TimelineEntry,
} from "@/types/api";

export async function getHealthBackground(patientId: string): Promise<HealthBackgroundResponse> {
  const { data } = await api.get<HealthBackgroundResponse>(`/api/patients/${patientId}/background`);
  return data;
}

export async function updateHealthBackground(
  patientId: string,
  body: HealthBackgroundRequest
): Promise<HealthBackgroundResponse> {
  const { data } = await api.put<HealthBackgroundResponse>(
    `/api/patients/${patientId}/background`,
    body
  );
  return data;
}

export async function getPatientTimeline(patientId: string): Promise<TimelineEntry[]> {
  const { data } = await api.get<TimelineEntry[]>(`/api/patients/${patientId}/timeline`);
  return data;
}
