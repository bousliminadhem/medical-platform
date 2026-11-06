import api from "@/lib/api-client";
import type { DocumentResponse, LookupResponse } from "@/types/api";

export async function listPatientDocuments(patientId: string): Promise<DocumentResponse[]> {
  const { data } = await api.get<DocumentResponse[]>(`/api/patients/${patientId}/documents`);
  return data;
}

export async function listDocumentTypes(): Promise<LookupResponse[]> {
  const { data } = await api.get<LookupResponse[]>("/api/lookups/DOCUMENT_TYPE");
  return data;
}

export async function uploadPatientDocument(
  patientId: string,
  file: File,
  type: string,
  consultationId?: string,
): Promise<DocumentResponse> {
  const body = new FormData();
  body.append("file", file);
  body.append("type", type);
  if (consultationId) body.append("consultationId", consultationId);
  const { data } = await api.post<DocumentResponse>(`/api/patients/${patientId}/documents`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function downloadDocument(id: string, fileName: string): Promise<void> {
  const { data } = await api.get<Blob>(`/api/documents/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function archiveDocument(id: string): Promise<void> {
  await api.delete(`/api/documents/${id}`);
}
