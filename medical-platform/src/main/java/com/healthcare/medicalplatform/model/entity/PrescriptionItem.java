package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record PrescriptionItem(
        @Column(nullable = false, length = 160) String medication,
        @Column(nullable = false, length = 80) String dosage,
        @Column(nullable = false, length = 80) String frequency,
        @Column(name = "duration_days", nullable = false) int durationDays) {
}
