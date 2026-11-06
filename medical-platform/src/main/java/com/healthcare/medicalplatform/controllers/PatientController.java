package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.PatientDtos.PatientContactResponse;
import com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse;
import com.healthcare.medicalplatform.model.dto.PatientDtos.UpdatePatientRequest;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.healthcare.medicalplatform.services.PatientService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * M2. Access per the report's matrix:
 * patient = own profile; practitioner = full view; assistant = contact/demographics only.
 * Returning a different DTO per role keeps health fields out of the assistant's payload.
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private static final int MAX_PAGE_SIZE = 50;

    private final PatientService patientService;
    private final CurrentUser currentUser;

    public PatientController(PatientService patientService, CurrentUser currentUser) {
        this.patientService = patientService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public PatientResponse me() {
        return patientService.getOwnResponse();
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public PatientResponse updateMe(@Valid @RequestBody UpdatePatientRequest request) {
        return patientService.updateResponse(currentUser.requireId(), request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public PagedModel<?> search(@RequestParam(required = false) String q,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by("lastName", "firstName"));
        Page<Patient> result = patientService.search(q, pageable);
        if (currentUser.hasRole("PRACTITIONER")) {
            return new PagedModel<>(result.map(PatientResponse::from));
        }
        return new PagedModel<>(result.map(PatientContactResponse::from));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public Object get(@PathVariable UUID id) {
        PatientResponse patient = patientService.getResponse(id);
        return currentUser.hasRole("PRACTITIONER")
                ? patient
                : new PatientContactResponse(patient.id(), patient.firstName(), patient.lastName(),
                patient.dateOfBirth(), patient.phone(), patient.address(),
                patient.emergencyContactName(), patient.emergencyContactPhone(),
                patient.insuranceProvider(), patient.insuranceNumber());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public Object update(@PathVariable UUID id, @Valid @RequestBody UpdatePatientRequest request) {
        PatientResponse patient = patientService.updateResponse(id, request);
        return currentUser.hasRole("PRACTITIONER")
                ? patient
                : new PatientContactResponse(patient.id(), patient.firstName(), patient.lastName(),
                patient.dateOfBirth(), patient.phone(), patient.address(),
                patient.emergencyContactName(), patient.emergencyContactPhone(),
                patient.insuranceProvider(), patient.insuranceNumber());
    }
}
