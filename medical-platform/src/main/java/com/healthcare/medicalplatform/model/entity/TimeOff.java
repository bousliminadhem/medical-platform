package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "time_off", indexes = @Index(columnList = "practitioner_id,start_at"))
public class TimeOff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "practitioner_id")
    private Practitioner practitioner;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(length = 200)
    private String reason;

    protected TimeOff() {
    }

    public TimeOff(Practitioner practitioner, Instant startAt, Instant endAt, String reason) {
        this.practitioner = practitioner;
        this.startAt = startAt;
        this.endAt = endAt;
        this.reason = reason;
    }

    public UUID getId() { return id; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public String getReason() { return reason; }
}
