package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.model.enums.ConsultationStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "consultations")
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "chief_complaint", length = 2000)
    private String chiefComplaint;

    @Column(name = "physical_findings", length = 4000)
    private String physicalFindings;

    @Column(length = 2000)
    private String diagnosis;

    @ElementCollection
    @CollectionTable(name = "prescription_items", joinColumns = @JoinColumn(name = "consultation_id"))
    private List<PrescriptionItem> prescription = new ArrayList<>();

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "routine_checks", length = 1000)
    private String routineChecks;

    @Column(name = "care_instructions", length = 2000)
    private String careInstructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ConsultationStatus status = ConsultationStatus.OPEN;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    protected Consultation() {
    }

    public Consultation(Appointment appointment) {
        this.appointment = appointment;
    }

    public void requireOpen() {
        if (status != ConsultationStatus.OPEN) {
            throw new ConflictException("Consultation is closed and can no longer be changed");
        }
    }

    public void close() {
        requireOpen();
        status = ConsultationStatus.CLOSED;
        closedAt = Instant.now();
    }

    public void setNotes(String chiefComplaint, String physicalFindings, String diagnosis) {
        if (chiefComplaint != null) this.chiefComplaint = chiefComplaint;
        if (physicalFindings != null) this.physicalFindings = physicalFindings;
        if (diagnosis != null) this.diagnosis = diagnosis;
    }

    public void setFollowUp(LocalDate date, String routineChecks, String careInstructions) {
        this.followUpDate = date;
        this.routineChecks = routineChecks;
        this.careInstructions = careInstructions;
    }

    public UUID getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getPhysicalFindings() { return physicalFindings; }
    public String getDiagnosis() { return diagnosis; }
    public List<PrescriptionItem> getPrescription() { return prescription; }
    public LocalDate getFollowUpDate() { return followUpDate; }
    public String getRoutineChecks() { return routineChecks; }
    public String getCareInstructions() { return careInstructions; }
    public ConsultationStatus getStatus() { return status; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getClosedAt() { return closedAt; }
}
