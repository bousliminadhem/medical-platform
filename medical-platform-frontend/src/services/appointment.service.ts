import api from "@/lib/api-client";
import type {
  AppointmentResponse,
  AppointmentStatus,
  BookAppointment,
  RequestAppointment,
  CancelRequest,
  RescheduleRequest,
  StatusRequest,
} from "@/types/api";

export async function bookAppointment(body: BookAppointment): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>("/api/appointments", body);
  return data;
}

export async function requestAppointment(body: RequestAppointment): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>("/api/appointments/request", body);
  return data;
}

export async function confirmAppointment(id: string): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>(`/api/appointments/${id}/confirm`);
  return data;
}

export async function rescheduleAppointment(
  id: string,
  body: RescheduleRequest
): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>(
    `/api/appointments/${id}/reschedule`,
    body
  );
  return data;
}

export async function cancelAppointment(
  id: string,
  body: CancelRequest
): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>(
    `/api/appointments/${id}/cancel`,
    body
  );
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<AppointmentResponse> {
  const body: StatusRequest = { status };
  const { data } = await api.patch<AppointmentResponse>(
    `/api/appointments/${id}/status`,
    body
  );
  return data;
}
