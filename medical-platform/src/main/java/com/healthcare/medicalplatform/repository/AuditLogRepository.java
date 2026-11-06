package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.AuditLog;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByActorId(UUID actorId, Pageable pageable);

    Page<AuditLog> findByActionAndCreatedAtBetween(AuditAction action, Instant from, Instant to,
                                                    Pageable pageable);

    Page<AuditLog> findByCreatedAtBetween(Instant from, Instant to, Pageable pageable);
}
