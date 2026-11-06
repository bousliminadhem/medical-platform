package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundResponse;
import com.healthcare.medicalplatform.model.entity.HealthBackground;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.HealthBackgroundRepository;
import com.healthcare.medicalplatform.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** 2.4 health background: the patient themself and treating practitioners only. */
@Service
public class HealthBackgroundService {

    private final HealthBackgroundRepository repository;
    private final PatientRepository patients;
    private final AccessGuard guard;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public HealthBackgroundService(HealthBackgroundRepository repository, PatientRepository patients,
                                   AccessGuard guard, AuditService auditService, CurrentUser currentUser) {
        this.repository = repository;
        this.patients = patients;
        this.guard = guard;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public HealthBackgroundResponse get(UUID patientId) {
        guard.requireClinicalAccess(patientId);
        audit(AuditAction.RECORD_VIEWED, patientId, "health background");
        return repository.findByPatientId(patientId)
                .map(HealthBackgroundResponse::from)
                .orElse(new HealthBackgroundResponse(null, null, null, null));
    }

    @Transactional
    public HealthBackgroundResponse update(UUID patientId, HealthBackgroundRequest req) {
        guard.requireClinicalAccess(patientId);
        Patient patient = patients.findById(patientId).filter(p -> !p.isArchived())
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        HealthBackground hb = repository.findByPatientId(patientId).orElseGet(() -> new HealthBackground(patient));
        hb.update(req.chronicConditions(), req.allergies(), req.longTermMedications());
        audit(AuditAction.PROFILE_UPDATED, patientId, "health background");
        return HealthBackgroundResponse.from(repository.save(hb));
    }

    private void audit(AuditAction action, UUID patientId, String details) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), action, "Patient", patientId.toString(), details);
    }
}
