package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.config.ClinicProperties;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import com.healthcare.medicalplatform.repository.AppointmentRepository;
import com.healthcare.medicalplatform.repository.PractitionerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
public class ScheduledJobs {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobs.class);
    private static final List<AppointmentStatus> OPEN =
            List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED);

    private final AppointmentRepository appointments;
    private final PractitionerRepository practitioners;
    private final NotificationService notifications;
    private final DocumentService documentService;
    private final AnalysisService analysisService;
    private final ZoneId zone;

    public ScheduledJobs(AppointmentRepository appointments, PractitionerRepository practitioners,
                         NotificationService notifications, DocumentService documentService,
                         AnalysisService analysisService, ClinicProperties clinic) {
        this.appointments = appointments;
        this.practitioners = practitioners;
        this.notifications = notifications;
        this.documentService = documentService;
        this.analysisService = analysisService;
        this.zone = clinic.zone();
    }

    /** Reminder for every open appointment starting within the next 24 hours (sent once). */
    @Scheduled(cron = "${app.jobs.reminders-cron:0 0 * * * *}")
    @Transactional
    public void sendReminders() {
        Instant now = Instant.now();
        appointments.findByStatusInAndReminderSentFalseAndStartAtBetween(OPEN, now, now.plus(Duration.ofHours(24)))
                .forEach(a -> {
                    notifications.send(a.getPatient().getEmail(), "Appointment reminder",
                            "You have an appointment on " + a.getStartAt().atZone(zone).toLocalDateTime());
                    a.markReminderSent();
                });
    }

    /** Daily agenda summary for every active practitioner. */
    @Scheduled(cron = "${app.jobs.daily-summary-cron:0 0 7 * * *}")
    @Transactional(readOnly = true)
    public void dailySummaries() {
        LocalDate today = LocalDate.now(zone);
        Instant from = today.atStartOfDay(zone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(zone).toInstant();
        practitioners.findByActiveTrueOrderByLastNameAsc().forEach(p -> {
            long count = appointments.countByPractitionerIdAndStatusInAndStartAtBetween(p.getId(), OPEN, from, to);
            notifications.send(p.getEmail(), "Today's agenda", count + " appointment(s) scheduled today");
        });
    }

    @Scheduled(cron = "${app.jobs.integrity-cron:0 30 2 * * *}")
    public void verifyDocumentIntegrity() {
        int failures = documentService.verifyAll();
        log.info("Document integrity check finished, {} failure(s)", failures);
    }

    @Scheduled(fixedDelayString = "${app.jobs.analysis-poll-ms:10000}")
    public void processAnalysisQueue() {
        analysisService.processPending();
    }
}
