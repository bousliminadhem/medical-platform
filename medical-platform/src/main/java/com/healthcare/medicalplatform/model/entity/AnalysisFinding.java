package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.FindingDecision;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analysis_findings")
public class AnalysisFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private AnalysisJob job;

    @Column(nullable = false, length = 160)
    private String label;

    @Column(nullable = false)
    private double confidence;

    @Column(length = 1000)
    private String annotation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FindingDecision decision = FindingDecision.PENDING;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected AnalysisFinding() {
    }

    public AnalysisFinding(AnalysisJob job, String label, double confidence, String annotation) {
        this.job = job;
        this.label = label;
        this.confidence = confidence;
        this.annotation = annotation;
    }

    public void review(FindingDecision decision, UUID reviewer) {
        this.decision = decision;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
    }

    public Long getId() { return id; }
    public AnalysisJob getJob() { return job; }
    public String getLabel() { return label; }
    public double getConfidence() { return confidence; }
    public String getAnnotation() { return annotation; }
    public FindingDecision getDecision() { return decision; }
}
