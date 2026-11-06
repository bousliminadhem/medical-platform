package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.Appointment;
import com.healthcare.medicalplatform.model.entity.Practitioner;
import com.healthcare.medicalplatform.model.entity.WorkingHours;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import jakarta.validation.constraints.*;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

public final class ScheduleDtos {

    private ScheduleDtos() {
    }

    public record WorkingHoursRequest(
            @NotNull DayOfWeek dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            LocalTime breakStart,
            LocalTime breakEnd,
            @Min(5) @Max(240) int slotMinutes) {
    }

    public record WorkingHoursResponse(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime,
                                       LocalTime breakStart, LocalTime breakEnd, int slotMinutes) {
        public static WorkingHoursResponse from(WorkingHours w) {
            return new WorkingHoursResponse(w.getDayOfWeek(), w.getStartTime(), w.getEndTime(),
                    w.getBreakStart(), w.getBreakEnd(), w.getSlotMinutes());
        }
    }

    public record TimeOffRequest(@NotNull Instant startAt, @NotNull Instant endAt, @Size(max = 200) String reason) {
    }

    public record SlotResponse(Instant start, Instant end) {
    }

    public record RequestAppointment(@NotNull UUID practitionerId, @NotNull Instant startAt,
                                     @Size(max = 500) String reason) {
    }

    public record BookAppointment(@NotNull UUID patientId, @NotNull UUID practitionerId,
                                  @NotNull Instant startAt, @Size(max = 500) String reason) {
    }

    public record RescheduleRequest(@NotNull Instant newStartAt) {
    }

    public record CancelRequest(@NotBlank @Size(max = 300) String reason) {
    }

    public record StatusRequest(@NotNull AppointmentStatus status) {
    }

    public record AppointmentResponse(UUID id, UUID patientId, String patientName, UUID practitionerId,
                                      String practitionerName, Instant startAt, Instant endAt,
                                      AppointmentStatus status, String reason, String cancelReason) {
        public static AppointmentResponse from(Appointment a) {
            return new AppointmentResponse(a.getId(),
                    a.getPatient().getId(),
                    a.getPatient().getFirstName() + " " + a.getPatient().getLastName(),
                    a.getPractitioner().getId(),
                    a.getPractitioner().getFirstName() + " " + a.getPractitioner().getLastName(),
                    a.getStartAt(), a.getEndAt(), a.getStatus(), a.getReason(), a.getCancelReason());
        }
    }

    public record PractitionerResponse(UUID id, String firstName, String lastName, String specialty,
                                       String licenseNumber, boolean active) {
        public static PractitionerResponse from(Practitioner p) {
            return new PractitionerResponse(p.getId(), p.getFirstName(), p.getLastName(),
                    p.getSpecialty() == null ? null : p.getSpecialty().getLabel(),
                    p.getLicenseNumber(), p.isActive());
        }
    }
}
