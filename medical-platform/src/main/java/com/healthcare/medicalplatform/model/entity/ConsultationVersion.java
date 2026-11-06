package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "consultation_versions")
public class ConsultationVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt = Instant.now();

    @Column(name = "chief_complaint", length = 2000)
    private String chiefComplaint;

    @Column(name = "physical_findings", length = 4000)
    private String physicalFindings;

    @Column(length = 2000)
    private String diagnosis;

    @ElementCollection
    @CollectionTable(name = "consultation_version_prescriptions", joinColumns = @JoinColumn(name = "version_id"))
    private List<PrescriptionItem> prescription = new ArrayList<>();

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "routine_checks", length = 1000)
    private String routineChecks;

    @Column(name = "care_instructions", length = 2000)
    private String careInstructions;

    protected ConsultationVersion() {
    }

    public ConsultationVersion(Consultation consultation, int versionNumber) {
        this.consultation = consultation;
        this.versionNumber = versionNumber;
        this.chiefComplaint = consultation.getChiefComplaint();
        this.physicalFindings = consultation.getPhysicalFindings();
        this.diagnosis = consultation.getDiagnosis();
        this.prescription.addAll(consultation.getPrescription());
        this.followUpDate = consultation.getFollowUpDate();
        this.routineChecks = consultation.getRoutineChecks();
        this.careInstructions = consultation.getCareInstructions();
    }

    public UUID getId() { return id; }
    public int getVersionNumber() { return versionNumber; }
    public Instant getCapturedAt() { return capturedAt; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getPhysicalFindings() { return physicalFindings; }
    public String getDiagnosis() { return diagnosis; }
    public List<PrescriptionItem> getPrescription() { return prescription; }
    public LocalDate getFollowUpDate() { return followUpDate; }
    public String getRoutineChecks() { return routineChecks; }
    public String getCareInstructions() { return careInstructions; }
}
