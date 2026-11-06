package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByPatientIdAndArchivedFalseOrderByUploadedAtDesc(UUID patientId);
    List<Document> findByArchivedFalse();
    List<Document> findByConsultationId(UUID consultationId);
    List<Document> findByPatientId(UUID patientId);
}
