package com.healthcare.medicalplatform.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 3.11 delivery channel. Logs only; replace the body with JavaMailSender / SMS.
 * Never put clinical content in notifications.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void send(String to, String subject, String body) {
        log.info("[NOTIFY] to={} subject='{}' body='{}'", to, subject, body);
    }
}
