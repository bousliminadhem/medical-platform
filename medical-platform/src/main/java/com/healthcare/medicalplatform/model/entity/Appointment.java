package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "appointments", indexes = {
        @Index(name = "idx_appt_practitioner_start", columnList = "practitioner_id,start_at"),
        @Index(name = "idx_appt_patient", columnList = "patient_id")
})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "practitioner_id")
    private Practitioner practitioner;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppointmentStatus status;

    @Column(length = 500)
    private String reason;

    @Column(name = "cancel_reason", length = 300)
    private String cancelReason;

    @Column(name = "reminder_sent", nullable = false)
    private boolean reminderSent;

    @Version
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Appointment() {
    }

    public Appointment(Patient patient, Practitioner practitioner, Instant startAt, Instant endAt,
                       AppointmentStatus status, String reason) {
        this.patient = patient;
        this.practitioner = practitioner;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = status;
        this.reason = reason;
    }

    public void transitionTo(AppointmentStatus next) {
        status.requireMoveTo(next);
        status = next;
    }

    public void cancel(String reason) {
        transitionTo(AppointmentStatus.CANCELLED);
        this.cancelReason = reason;
    }

    public void reschedule(Instant newStart, Instant newEnd, AppointmentStatus statusAfter) {
        this.startAt = newStart;
        this.endAt = newEnd;
        this.status = statusAfter;
        this.reminderSent = false;
    }

    public void markReminderSent() { this.reminderSent = true; }

    public UUID getId() { return id; }
    public Patient getPatient() { return patient; }
    public Practitioner getPractitioner() { return practitioner; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public AppointmentStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getCancelReason() { return cancelReason; }
}
