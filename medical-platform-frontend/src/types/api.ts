// ─── Auth ──────────────────────────────────────────────────────────────────
export type Role = "PATIENT" | "PRACTITIONER" | "MEDICAL_ASSISTANT" | "ADMIN";

export interface LoginRequest {
  /** @minLength 1 */
  email: string;
  /** @minLength 1 */
  password: string;
}

export interface RegisterPatientRequest {
  /** @format email @maxLength 254 */
  email: string;
  /** @minLength 10 @maxLength 128 */
  password: string;
  /** @maxLength 80 */
  firstName: string;
  /** @maxLength 80 */
  lastName: string;
  /** @format date */
  dateOfBirth: string;
  /** @maxLength 32 */
  phone?: string;
  /** @maxLength 64 */
  nationalId?: string;
}

export interface ChangePasswordRequest {
  /** @minLength 1 */
  currentPassword: string;
  /** @minLength 10 @maxLength 128 */
  newPassword: string;
}

export interface UpdateAccountRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  /** @format date-time */
  expiresAt: string;
  user: UserSummary;
}

export interface UserSummary {
  /** @format uuid */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Role[];
}

// ─── Admin / Staff ──────────────────────────────────────────────────────────
export interface CreateStaffRequest {
  /** @format email @maxLength 254 */
  email: string;
  /** @minLength 10 @maxLength 128 */
  temporaryPassword: string;
  role: Role;
  /** @maxLength 80 */
  firstName: string;
  /** @maxLength 80 */
  lastName: string;
  /** @maxLength 32 */
  phone?: string;
  /** @maxLength 64 — Practitioners only */
  licenseNumber?: string;
  /** @maxLength 64 — Practitioners only */
  specialtyCode?: string;
}

export interface UpdateStaffRequest {
  /** @format email @maxLength 254 */
  email: string;
  /** @maxLength 80 */
  firstName: string;
  /** @maxLength 80 */
  lastName: string;
  /** @maxLength 32 */
  phone?: string;
  /** @maxLength 64 — Practitioners only */
  licenseNumber?: string;
  /** @maxLength 64 — Practitioners only */
  specialtyCode?: string;
}

export interface StaffResponse {
  /** @format uuid */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  roles: Role[];
  enabled: boolean;
  licenseNumber?: string;
  specialty?: string;
  specialtyCode?: string;
  active?: boolean;
  archived?: boolean;
}

// ─── Practitioners / Schedule ───────────────────────────────────────────────
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface PractitionerResponse {
  /** @format uuid */
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber: string;
  active: boolean;
}

export interface WorkingHoursRequest {
  dayOfWeek: DayOfWeek;
  /** @format time-local e.g. "09:00:00" */
  startTime: string;
  /** @format time-local */
  endTime: string;
  /** @format time-local */
  breakStart?: string;
  /** @format time-local */
  breakEnd?: string;
  /** @minimum 5 @maximum 240 */
  slotMinutes?: number;
}

export interface WorkingHoursResponse {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  slotMinutes?: number;
}

export interface TimeOffRequest {
  /** @format date-time */
  startAt: string;
  /** @format date-time */
  endAt: string;
  /** @maxLength 200 */
  reason?: string;
}

export interface SlotResponse {
  /** @format date-time */
  start: string;
  /** @format date-time */
  end: string;
}

// ─── Patients ──────────────────────────────────────────────────────────────
export interface PatientResponse {
  /** @format uuid */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** @format date */
  dateOfBirth: string;
  phone: string;
  nationalId: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  gender: string;
  bloodType: string;
  archived: boolean;
}

export interface UpdatePatientRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  /** @format date */
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  genderCode?: string;
  bloodTypeCode?: string;
}

export interface CreatePatientRequest extends UpdatePatientRequest {
  email: string;
  temporaryPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationalId?: string;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedModel<T> {
  content: T[];
  page: PageMetadata;
}

// ─── Health Background ────────────────────────────────────────────────────
export interface HealthBackgroundRequest {
  chronicConditions?: string;
  allergies?: string;
  longTermMedications?: string;
}

export interface HealthBackgroundResponse {
  chronicConditions: string;
  allergies: string;
  longTermMedications: string;
  /** @format date-time */
  updatedAt: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────
export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface AppointmentResponse {
  /** @format uuid */
  id: string;
  /** @format uuid */
  patientId: string;
  patientName: string;
  /** @format uuid */
  practitionerId: string;
  practitionerName: string;
  /** @format date-time */
  startAt: string;
  /** @format date-time */
  endAt: string;
  status: AppointmentStatus;
  reason: string;
  cancelReason: string;
}

export interface BookAppointment {
  /** @format uuid */
  patientId: string;
  /** @format uuid */
  practitionerId: string;
  /** @format date-time */
  startAt: string;
  reason?: string;
}

export interface RequestAppointment {
  /** @format uuid */
  practitionerId: string;
  /** @format date-time */
  startAt: string;
  reason?: string;
}

export interface RescheduleRequest {
  /** @format date-time */
  newStartAt: string;
}

export interface CancelRequest {
  /** @maxLength 300 */
  reason: string;
}

export interface StatusRequest {
  status: AppointmentStatus;
}

// ─── Consultations ────────────────────────────────────────────────────────
export type ConsultationStatus = "OPEN" | "CLOSED";

export interface ConsultationResponse {
  /** @format uuid */
  id: string;
  /** @format uuid */
  appointmentId: string;
  /** @format uuid */
  patientId: string;
  /** @format uuid */
  practitionerId: string;
  patientName: string;
  practitionerName: string;
  status: ConsultationStatus;
  chiefComplaint: string;
  physicalFindings: string;
  diagnosis: string;
  prescription: PrescriptionItemResponse[];
  /** @format date */
  followUpDate: string;
  routineChecks: string;
  careInstructions: string;
  /** @format date-time */
  openedAt: string;
  /** @format date-time */
  closedAt: string;
}

export interface ConsultationVersionResponse {
  id: string;
  versionNumber: number;
  capturedAt: string;
  chiefComplaint: string;
  physicalFindings: string;
  diagnosis: string;
  prescription: PrescriptionItemResponse[];
  followUpDate: string;
  routineChecks: string;
  careInstructions: string;
}

export interface NotesRequest {
  chiefComplaint?: string;
  physicalFindings?: string;
  diagnosis?: string;
}

export interface FollowUpRequest {
  /** @format date */
  followUpDate?: string;
  routineChecks?: string;
  careInstructions?: string;
}

export interface IssuePrescriptionRequest {
  items: PrescriptionItemRequest[];
}

export interface PrescriptionItemRequest {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
}

export interface PrescriptionItemResponse {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

// ─── Documents ────────────────────────────────────────────────────────────
export interface DocumentResponse {
  /** @format uuid */
  id: string;
  /** @format uuid */
  patientId: string;
  /** @format uuid */
  consultationId: string | null;
  type: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** @format date-time */
  uploadedAt: string;
}

export interface ClassifyRequest {
  typeCode: string;
}

export interface LinkRequest {
  /** @format uuid */
  consultationId: string;
}

// ─── Analysis / Findings ─────────────────────────────────────────────────
export type AnalysisStatus =
  | "QUEUED"
  | "PROCESSING"
  | "ANALYSIS_READY"
  | "FAILED";

export type FindingDecision = "PENDING" | "VALIDATED" | "DISMISSED";

export interface AnalysisResponse {
  /** @format uuid */
  jobId: string;
  /** @format uuid */
  documentId: string;
  status: AnalysisStatus;
  /** @format date-time */
  requestedAt: string;
  /** @format date-time */
  completedAt: string;
  error: string;
  findings: FindingResponse[];
}

export interface FindingResponse {
  id: number;
  label: string;
  confidence: number;
  annotation: string;
  decision: FindingDecision;
}

export interface ReviewRequest {
  decision: FindingDecision;
}

// ─── Lookups ──────────────────────────────────────────────────────────────
export interface LookupResponse {
  id: number;
  category: string;
  code: string;
  label: string;
  active: boolean;
}

export interface CreateLookupRequest {
  /** pattern: [A-Z][A-Z0-9_]* */
  category: string;
  code: string;
  label: string;
}

export interface UpdateLookupRequest {
  label?: string;
  active?: boolean;
}

// ─── Timeline ─────────────────────────────────────────────────────────────
export interface TimelineEntry {
  /** @format date-time */
  at: string;
  type: string;
  title: string;
  refId: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────
export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "ACCOUNT_CREATED"
  | "ACCOUNT_LOCKED"
  | "PASSWORD_CHANGED"
  | "PROFILE_UPDATED"
  | "RECORD_VIEWED"
  | "RECORD_SEARCHED"
  | "RECORD_ARCHIVED"
  | "APPOINTMENT_CHANGED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_CHANGED"
  | "DOCUMENT_ARCHIVED"
  | "INTEGRITY_FAILURE"
  | "FINDING_REVIEWED"
  | "CONSULTATION_OPENED"
  | "PRESCRIPTION_ISSUED"
  | "CONSULTATION_CLOSED"
  | "LOOKUP_CHANGED";

export interface AuditEntry {
  id: number;
  /** @format uuid */
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  ipAddress: string;
  details: string;
  /** @format date-time */
  createdAt: string;
}

export interface PagedModelAuditEntry {
  content: AuditEntry[];
  page: PageMetadata;
}
