package com.healthcare.medicalplatform.listener;

import com.healthcare.medicalplatform.model.enums.AuditAction;

import java.util.UUID;

/** Published by services; persisted by {@link AuditEventListener}. */
public record AuditEvent(
        UUID actorId,
        String actorEmail,
        AuditAction action,
        String targetType,
        String targetId,
        String ipAddress,
        String details) {
}
