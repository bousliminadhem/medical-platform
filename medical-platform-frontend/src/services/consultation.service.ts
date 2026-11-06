import api from "@/lib/api-client";
import type {
  ConsultationResponse,
  FollowUpRequest,
  IssuePrescriptionRequest,
  NotesRequest,
  ConsultationVersionResponse,
} from "@/types/api";

export async function openConsultation(appointmentId: string): Promise<ConsultationResponse> {
  const { data } = await api.post<ConsultationResponse>(`/api/appointments/${appointmentId}/consultation`);
  return data;
}

export async function getConsultation(id: string): Promise<ConsultationResponse> {
  const { data } = await api.get<ConsultationResponse>(`/api/consultations/${id}`);
  return data;
}

export async function listPractitionerConsultations(): Promise<ConsultationResponse[]> {
  const { data } = await api.get<ConsultationResponse[]>("/api/consultations");
  return data;
}

export async function listPatientConsultations(patientId: string): Promise<ConsultationResponse[]> {
  const { data } = await api.get<ConsultationResponse[]>(`/api/patients/${patientId}/consultations`);
  return data;
}

export async function listConsultationVersions(id: string): Promise<ConsultationVersionResponse[]> {
  const { data } = await api.get<ConsultationVersionResponse[]>(`/api/consultations/${id}/versions`);
  return data;
}

export async function saveConsultationNotes(id: string, body: NotesRequest): Promise<ConsultationResponse> {
  const { data } = await api.put<ConsultationResponse>(`/api/consultations/${id}/notes`, body);
  return data;
}

export async function saveConsultationFollowUp(id: string, body: FollowUpRequest): Promise<ConsultationResponse> {
  const { data } = await api.put<ConsultationResponse>(`/api/consultations/${id}/follow-up`, body);
  return data;
}

export async function issuePrescription(id: string, body: IssuePrescriptionRequest): Promise<ConsultationResponse> {
  const { data } = await api.post<ConsultationResponse>(`/api/consultations/${id}/prescription`, body);
  return data;
}

export async function closeConsultation(id: string): Promise<ConsultationResponse> {
  const { data } = await api.post<ConsultationResponse>(`/api/consultations/${id}/close`);
  return data;
}
