package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents", indexes = @Index(name = "idx_doc_patient", columnList = "patient_id"))
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id")
    private LookupValue type;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    /** Relative to the storage root; generated, never derived from user input. */
    @Column(name = "storage_path", nullable = false, length = 120)
    private String storagePath;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();

    @Column(nullable = false)
    private boolean archived;

    protected Document() {
    }

    public Document(Patient patient, Consultation consultation, LookupValue type, String originalName,
                    String contentType, long sizeBytes, String storagePath, String sha256, UUID uploadedBy) {
        this.patient = patient;
        this.consultation = consultation;
        this.type = type;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storagePath = storagePath;
        this.sha256 = sha256;
        this.uploadedBy = uploadedBy;
    }

    public void archive() { this.archived = true; }
    public void setType(LookupValue type) { this.type = type; }
    public void setConsultation(Consultation consultation) { this.consultation = consultation; }

    public UUID getId() { return id; }
    public Patient getPatient() { return patient; }
    public Consultation getConsultation() { return consultation; }
    public LookupValue getType() { return type; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getStoragePath() { return storagePath; }
    public String getSha256() { return sha256; }
    public UUID getUploadedBy() { return uploadedBy; }
    public Instant getUploadedAt() { return uploadedAt; }
    public boolean isArchived() { return archived; }
}
