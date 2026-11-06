package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.Consultation;
import com.healthcare.medicalplatform.model.entity.HealthBackground;
import com.healthcare.medicalplatform.model.entity.PrescriptionItem;
import com.healthcare.medicalplatform.model.enums.ConsultationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ClinicalDtos {

    private ClinicalDtos() {
    }

    /** Null fields are left unchanged. */
    public record NotesRequest(@Size(max = 2000) String chiefComplaint,
                               @Size(max = 4000) String physicalFindings,
                               @Size(max = 2000) String diagnosis) {
    }

    public record PrescriptionItemRequest(@NotBlank @Size(max = 160) String medication,
                                          @NotBlank @Size(max = 80) String dosage,
                                          @NotBlank @Size(max = 80) String frequency,
                                          @Min(1) @Max(365) int durationDays) {
    }

    public record IssuePrescriptionRequest(@NotEmpty @Valid List<PrescriptionItemRequest> items) {
    }

    public record FollowUpRequest(@FutureOrPresent LocalDate followUpDate,
                                  @Size(max = 1000) String routineChecks,
                                  @Size(max = 2000) String careInstructions) {
    }

    public record PrescriptionItemResponse(String medication, String dosage, String frequency, int durationDays) {
        public static PrescriptionItemResponse from(PrescriptionItem i) {
            return new PrescriptionItemResponse(i.medication(), i.dosage(), i.frequency(), i.durationDays());
        }
    }

    public record ConsultationResponse(UUID id, UUID appointmentId, UUID patientId, UUID practitionerId,
                                       String patientName, String practitionerName,
                                       ConsultationStatus status, String chiefComplaint,
                                       String physicalFindings, String diagnosis,
                                       List<PrescriptionItemResponse> prescription,
                                       LocalDate followUpDate, String routineChecks, String careInstructions,
                                       Instant openedAt, Instant closedAt) {
        public static ConsultationResponse from(Consultation c) {
            return new ConsultationResponse(c.getId(), c.getAppointment().getId(),
                    c.getAppointment().getPatient().getId(), c.getAppointment().getPractitioner().getId(),
                    c.getAppointment().getPatient().getFirstName() + " " + c.getAppointment().getPatient().getLastName(),
                    c.getAppointment().getPractitioner().getFirstName() + " " + c.getAppointment().getPractitioner().getLastName(),
                    c.getStatus(), c.getChiefComplaint(), c.getPhysicalFindings(), c.getDiagnosis(),
                    c.getPrescription().stream().map(PrescriptionItemResponse::from).toList(),
                    c.getFollowUpDate(), c.getRoutineChecks(), c.getCareInstructions(),
                    c.getOpenedAt(), c.getClosedAt());
        }

    }

    public record ConsultationVersionResponse(UUID id, int versionNumber, Instant capturedAt,
                                              String chiefComplaint, String physicalFindings, String diagnosis,
                                              List<PrescriptionItemResponse> prescription,
                                              LocalDate followUpDate, String routineChecks, String careInstructions) {
        public static ConsultationVersionResponse from(com.healthcare.medicalplatform.model.entity.ConsultationVersion v) {
            return new ConsultationVersionResponse(v.getId(), v.getVersionNumber(), v.getCapturedAt(),
                    v.getChiefComplaint(), v.getPhysicalFindings(), v.getDiagnosis(),
                    v.getPrescription().stream().map(PrescriptionItemResponse::from).toList(),
                    v.getFollowUpDate(), v.getRoutineChecks(), v.getCareInstructions());
        }
    }

    public record HealthBackgroundRequest(@Size(max = 4000) String chronicConditions,
                                          @Size(max = 4000) String allergies,
                                          @Size(max = 4000) String longTermMedications) {
    }

    public record HealthBackgroundResponse(String chronicConditions, String allergies,
                                           String longTermMedications, Instant updatedAt) {
        public static HealthBackgroundResponse from(HealthBackground h) {
            return new HealthBackgroundResponse(h.getChronicConditions(), h.getAllergies(),
                    h.getLongTermMedications(), h.getUpdatedAt());
        }
    }

    public record TimelineEntry(Instant at, String type, String title, String refId) {
    }
}
