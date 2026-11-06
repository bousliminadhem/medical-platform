package com.healthcare.medicalplatform.listener;

import com.healthcare.medicalplatform.model.entity.AuditLog;
import com.healthcare.medicalplatform.repository.AuditLogRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(AuditEvent event) {
        auditLogRepository.save(new AuditLog(
                event.actorId(), event.actorEmail(), event.action(),
                event.targetType(), event.targetId(), event.ipAddress(), event.details()));
    }
}
