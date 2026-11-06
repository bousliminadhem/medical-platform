package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** 2.4 chronic conditions, allergies, long-term medications. Never shown to medical assistants. */
@Entity
@Table(name = "health_backgrounds")
public class HealthBackground {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private Patient patient;

    @Column(name = "chronic_conditions", length = 4000)
    private String chronicConditions;

    @Column(length = 4000)
    private String allergies;

    @Column(name = "long_term_medications", length = 4000)
    private String longTermMedications;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected HealthBackground() {
    }

    public HealthBackground(Patient patient) {
        this.patient = patient;
    }

    public void update(String chronic, String allergies, String medications) {
        this.chronicConditions = chronic;
        this.allergies = allergies;
        this.longTermMedications = medications;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Patient getPatient() { return patient; }
    public String getChronicConditions() { return chronicConditions; }
    public String getAllergies() { return allergies; }
    public String getLongTermMedications() { return longTermMedications; }
    public Instant getUpdatedAt() { return updatedAt; }
}
