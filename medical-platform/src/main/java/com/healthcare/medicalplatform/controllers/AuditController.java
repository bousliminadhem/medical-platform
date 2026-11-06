package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.entity.AuditLog;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {

    private final AuditLogRepository repository;

    public AuditController(AuditLogRepository repository) {
        this.repository = repository;
    }

    public record AuditEntry(Long id, UUID actorId, String actorEmail, AuditAction action, String targetType,
                             String targetId, String ipAddress, String details, Instant createdAt) {
        static AuditEntry from(AuditLog l) {
            return new AuditEntry(l.getId(), l.getActorId(), l.getActorEmail(), l.getAction(), l.getTargetType(),
                    l.getTargetId(), l.getIpAddress(), l.getDetails(), l.getCreatedAt());
        }
    }

    /** Filter by actor, or by time window (+ optional action). Defaults to the last 7 days. */
    @GetMapping
    public PagedModel<AuditEntry> search(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Instant end = to != null ? to : Instant.now();
        Instant start = from != null ? from : end.minusSeconds(7L * 24 * 3600);

        Page<AuditLog> result;
        if (actorId != null) {
            result = repository.findByActorId(actorId, pageable);
        } else if (action != null) {
            result = repository.findByActionAndCreatedAtBetween(action, start, end, pageable);
        } else {
            result = repository.findByCreatedAtBetween(start, end, pageable);
        }
        return new PagedModel<>(result.map(AuditEntry::from));
    }
}
