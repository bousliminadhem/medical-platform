import api from "@/lib/api-client";
import type {
  CreateStaffRequest,
  UpdateStaffRequest,
  UserSummary,
  StaffResponse,
  LookupResponse,
  CreateLookupRequest,
  UpdateLookupRequest,
  PatientResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  AuditAction,
  AuditEntry,
  PagedModel,
} from "@/types/api";

// ─── Staff ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?archived={archived}
 * Lists staff members.
 * Set archived=false for active roster, archived=true for Trash space.
 */
export async function listStaff(archived: boolean = false): Promise<StaffResponse[]> {
  const { data } = await api.get<StaffResponse[]>("/api/admin/users", {
    params: { archived },
  });
  return data;
}

/**
 * POST /api/admin/users/{id}/archive
 * Soft-deletes a staff member (moves to Trash space).
 */
export async function archiveStaff(id: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/archive`);
}

/**
 * POST /api/admin/users/{id}/restore
 * Restores an archived staff member from Trash space.
 */
export async function restoreStaff(id: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/restore`);
}

/**
 * DELETE /api/admin/users/{id}/permanent
 * Permanently deletes a staff member with full cascade of appointments, hours, time-off.
 */
export async function deleteStaffPermanently(id: string): Promise<void> {
  await api.delete(`/api/admin/users/${id}/permanent`);
}

/**
 * POST /api/admin/users
 * Creates a Practitioner, Medical Assistant, or Admin account. Returns 201.
 */
export async function createStaff(
  body: CreateStaffRequest
): Promise<UserSummary> {
  const { data } = await api.post<UserSummary>("/api/admin/users", body);
  return data;
}

/**
 * PUT /api/admin/users/{id}
 * Updates a staff member's profile details.
 */
export async function updateStaff(
  id: string,
  body: UpdateStaffRequest
): Promise<StaffResponse> {
  const { data } = await api.put<StaffResponse>(`/api/admin/users/${id}`, body);
  return data;
}

/**
 * PATCH /api/admin/users/{id}/enabled/{enabled}
 * Enable or disable a staff account.
 */
export async function setUserEnabled(
  id: string,
  enabled: boolean
): Promise<void> {
  await api.patch(`/api/admin/users/${id}/enabled/${enabled}`);
}

// ─── Patient admin ────────────────────────────────────────────────────────

/**
 * POST /api/admin/patients/{id}/archive
 * Archives (soft-deletes) a patient record.
 */
export async function archivePatient(id: string): Promise<void> {
  await api.post(`/api/admin/patients/${id}/archive`);
}

export async function listPatients(archived = false): Promise<PatientResponse[]> {
  const { data } = await api.get<PatientResponse[]>("/api/admin/patients", {
    params: { archived },
  });
  return data;
}

export async function createPatient(body: CreatePatientRequest): Promise<PatientResponse> {
  const { data } = await api.post<PatientResponse>("/api/admin/patients", body);
  return data;
}

export async function updatePatient(
  id: string,
  body: UpdatePatientRequest
): Promise<PatientResponse> {
  const { data } = await api.put<PatientResponse>(`/api/patients/${id}`, body);
  return data;
}

export async function restorePatient(id: string): Promise<void> {
  await api.post(`/api/admin/patients/${id}/restore`);
}

export async function deletePatientPermanently(id: string): Promise<void> {
  await api.delete(`/api/admin/patients/${id}/permanent`);
}

// ─── Lookups ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/lookups/{category}
 * Returns ALL lookup values (including inactive) for admin views.
 */
export async function adminListLookups(
  category: string
): Promise<LookupResponse[]> {
  const { data } = await api.get<LookupResponse[]>(
    `/api/admin/lookups/${category}`
  );
  return data;
}

/**
 * POST /api/admin/lookups
 * Creates a new lookup value. Returns 201.
 */
export async function createLookup(
  body: CreateLookupRequest
): Promise<LookupResponse> {
  const { data } = await api.post<LookupResponse>("/api/admin/lookups", body);
  return data;
}

/**
 * PUT /api/admin/lookups/{id}
 * Updates label or active flag of a lookup entry.
 */
export async function updateLookup(
  id: number,
  body: UpdateLookupRequest
): Promise<LookupResponse> {
  const { data } = await api.put<LookupResponse>(
    `/api/admin/lookups/${id}`,
    body
  );
  return data;
}

export async function searchAudit(options: {
  action?: AuditAction;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
} = {}): Promise<PagedModel<AuditEntry>> {
  const { data } = await api.get<PagedModel<AuditEntry>>("/api/admin/audit", {
    params: options,
  });
  return data;
}
