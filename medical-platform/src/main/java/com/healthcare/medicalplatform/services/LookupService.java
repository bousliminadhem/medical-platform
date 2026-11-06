package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.LookupDtos.CreateLookupRequest;
import com.healthcare.medicalplatform.model.dto.LookupDtos.LookupResponse;
import com.healthcare.medicalplatform.model.dto.LookupDtos.UpdateLookupRequest;
import com.healthcare.medicalplatform.model.entity.LookupValue;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.LookupValueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** S1 Reference Data. */
@Service
public class LookupService {

    private final LookupValueRepository repository;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public LookupService(LookupValueRepository repository, AuditService auditService,
                         CurrentUser currentUser) {
        this.repository = repository;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    /** S1.2 read active values (dropdowns). */
    @Transactional(readOnly = true)
    public List<LookupResponse> listActive(String category) {
        return repository.findByCategoryAndActiveTrueOrderByLabelAsc(category.toUpperCase()).stream()
                .map(LookupResponse::from).toList();
    }

    /** Admin view including deactivated values. */
    @Transactional(readOnly = true)
    public List<LookupResponse> listAll(String category) {
        return repository.findByCategoryOrderByLabelAsc(category.toUpperCase()).stream()
                .map(LookupResponse::from).toList();
    }

    /** S1.1 */
    @Transactional
    public LookupResponse create(CreateLookupRequest req) {
        if (repository.existsByCategoryAndCode(req.category(), req.code())) {
            throw new ConflictException("Lookup value already exists");
        }
        LookupValue saved = repository.save(new LookupValue(req.category(), req.code(), req.label()));
        audit(saved, "created");
        return LookupResponse.from(saved);
    }

    /** S1.1 edit or deactivate. Values are never deleted so old records keep their meaning. */
    @Transactional
    public LookupResponse update(Long id, UpdateLookupRequest req) {
        LookupValue value = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Lookup value not found"));
        if (req.label() != null) {
            value.setLabel(req.label());
        }
        if (req.active() != null) {
            value.setActive(req.active());
        }
        audit(value, "updated");
        return LookupResponse.from(value);
    }

    /** Resolve an optional code or label to an active value; null/blank means "not provided". */
    @Transactional(readOnly = true)
    public LookupValue resolve(String category, String codeOrLabel) {
        if (codeOrLabel == null || codeOrLabel.isBlank()) {
            return null;
        }
        String clean = codeOrLabel.trim();
        // 1. Match by exact code
        java.util.Optional<LookupValue> byCode = repository.findByCategoryAndCode(category.toUpperCase(), clean.toUpperCase())
                .filter(LookupValue::isActive);
        if (byCode.isPresent()) {
            return byCode.get();
        }
        // 2. Match by label (case-insensitive)
        java.util.Optional<LookupValue> byLabel = repository.findByCategoryAndLabelIgnoreCase(category.toUpperCase(), clean)
                .filter(LookupValue::isActive);
        if (byLabel.isPresent()) {
            return byLabel.get();
        }
        // 3. Fallback: normalize spaces to underscores and retry as code
        String normalized = clean.toUpperCase().replace(" ", "_");
        return repository.findByCategoryAndCode(category.toUpperCase(), normalized)
                .filter(LookupValue::isActive)
                .orElseThrow(() -> new BadRequestException(
                        "Unknown " + category + " code: " + codeOrLabel));
    }

    private void audit(LookupValue v, String what) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.LOOKUP_CHANGED,
                "LookupValue", String.valueOf(v.getId()), what + " " + v.getCategory() + "/" + v.getCode());
    }
}
