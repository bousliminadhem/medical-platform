import api, { tokenStore } from "@/lib/api-client";
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterPatientRequest,
  UserSummary,
  UpdateAccountRequest,
} from "@/types/api";

/**
 * POST /api/auth/login
 * Returns JWT + user summary. Persists the token automatically.
 */
export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", body);
  tokenStore.set(data.accessToken, data.expiresAt);
  return data;
}

/**
 * POST /api/auth/register
 * Self-registration for patients. Returns 201 + JWT.
 */
export async function registerPatient(
  body: RegisterPatientRequest
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", body);
  tokenStore.set(data.accessToken, data.expiresAt);
  return data;
}

/**
 * POST /api/auth/logout
 * Invalidates the server-side session; clears the local token.
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout");
  } finally {
    tokenStore.clear();
  }
}

/**
 * GET /api/auth/me
 * Returns the currently-authenticated user's summary.
 */
export async function getMe(): Promise<UserSummary> {
  const { data } = await api.get<UserSummary>("/api/auth/me");
  return data;
}

/**
 * POST /api/auth/password
 * Changes the authenticated user's password.
 */
export async function changePassword(
  body: ChangePasswordRequest
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/password", body);
  tokenStore.set(data.accessToken, data.expiresAt);
  return data;
}

export async function updateAccount(body: UpdateAccountRequest): Promise<UserSummary> {
  const { data } = await api.put<UserSummary>("/api/auth/me", body);
  return data;
}
