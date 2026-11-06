import api from "@/lib/api-client";
import type { PatientResponse } from "@/types/api";

export async function getMyPatient(): Promise<PatientResponse> {
  const { data } = await api.get<PatientResponse>("/api/patients/me");
  return data;
}
