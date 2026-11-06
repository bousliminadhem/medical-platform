package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ClinicalDtos.*;
import com.healthcare.medicalplatform.services.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ConsultationController {

    private final ConsultationService service;

    public ConsultationController(ConsultationService service) {
        this.service = service;
    }

    @PostMapping("/appointments/{appointmentId}/consultation")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ConsultationResponse open(@PathVariable UUID appointmentId) {
        return service.open(appointmentId);
    }

    @PutMapping("/consultations/{id}/notes")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ConsultationResponse notes(@PathVariable UUID id, @Valid @RequestBody NotesRequest request) {
        return service.recordNotes(id, request);
    }

    @PostMapping("/consultations/{id}/prescription")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ConsultationResponse prescribe(@PathVariable UUID id,
                                          @Valid @RequestBody IssuePrescriptionRequest request) {
        return service.issuePrescription(id, request);
    }

    @PutMapping("/consultations/{id}/follow-up")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ConsultationResponse followUp(@PathVariable UUID id, @Valid @RequestBody FollowUpRequest request) {
        return service.defineFollowUp(id, request);
    }

    @PostMapping("/consultations/{id}/close")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ConsultationResponse close(@PathVariable UUID id) {
        return service.close(id);
    }

    @GetMapping("/consultations/{id}/versions")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public List<ConsultationVersionResponse> versions(@PathVariable UUID id) {
        return service.versions(id);
    }

    @GetMapping("/consultations/{id}")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER')")
    public ConsultationResponse view(@PathVariable UUID id) {
        return service.view(id);
    }

    @GetMapping("/consultations")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public List<ConsultationResponse> forPractitioner() {
        return service.listForPractitioner();
    }

    @GetMapping("/patients/{patientId}/consultations")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER')")
    public List<ConsultationResponse> forPatient(@PathVariable UUID patientId) {
        return service.listForPatient(patientId);
    }
}
