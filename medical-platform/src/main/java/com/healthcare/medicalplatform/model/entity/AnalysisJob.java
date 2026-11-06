package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.AnalysisStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "analysis_jobs", indexes = @Index(columnList = "status,requested_at"))
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id")
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AnalysisStatus status = AnalysisStatus.QUEUED;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnalysisFinding> findings = new ArrayList<>();

    protected AnalysisJob() {
    }

    public AnalysisJob(Document document) {
        this.document = document;
    }

    public void start() { status = AnalysisStatus.PROCESSING; }

    public void complete() {
        status = AnalysisStatus.ANALYSIS_READY;
        completedAt = Instant.now();
    }

    public void fail(String message) {
        status = AnalysisStatus.FAILED;
        completedAt = Instant.now();
        errorMessage = message == null ? "Analysis failed" : message.substring(0, Math.min(500, message.length()));
    }

    public void addFinding(AnalysisFinding finding) { findings.add(finding); }

    public UUID getId() { return id; }
    public Document getDocument() { return document; }
    public AnalysisStatus getStatus() { return status; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public String getErrorMessage() { return errorMessage; }
    public List<AnalysisFinding> getFindings() { return findings; }
}
