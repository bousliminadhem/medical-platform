package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.listener.AuditEvent;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Service
public class AuditService {

    private final ApplicationEventPublisher publisher;

    public AuditService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void record(UUID actorId, String actorEmail, AuditAction action,
                       String targetType, String targetId, String details) {
        publisher.publishEvent(new AuditEvent(
                actorId, actorEmail, action, targetType, targetId, currentIp(), truncate(details)));
    }

    private static String currentIp() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            HttpServletRequest req = sra.getRequest();
            return req.getRemoteAddr();
        }
        return null;
    }

    private static String truncate(String s) {
        return s == null || s.length() <= 500 ? s : s.substring(0, 500);
    }
}
