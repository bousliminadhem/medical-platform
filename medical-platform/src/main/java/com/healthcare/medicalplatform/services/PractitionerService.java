package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.PractitionerResponse;
import com.healthcare.medicalplatform.model.entity.Practitioner;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.PractitionerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** 3.1 practitioner profiles. */
@Service
public class PractitionerService {

    private final PractitionerRepository repository;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public PractitionerService(PractitionerRepository repository, AuditService auditService,
                               CurrentUser currentUser) {
        this.repository = repository;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<PractitionerResponse> listActive() {
        return repository.findByActiveTrueOrderByLastNameAsc().stream()
                .filter(p -> !p.isArchived())
                .map(PractitionerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PractitionerResponse> listAll() {
        return repository.findAllByOrderByLastNameAsc().stream()
                .filter(p -> !p.isArchived())
                .map(PractitionerResponse::from)
                .toList();
    }

    @Transactional
    public PractitionerResponse setActive(UUID id, boolean active) {
        Practitioner p = repository.findById(id).orElseThrow(() -> new NotFoundException("Practitioner not found"));
        p.setActive(active);
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.PROFILE_UPDATED, "Practitioner",
                id.toString(), active ? "activated" : "deactivated");
        return PractitionerResponse.from(p);
    }
}
