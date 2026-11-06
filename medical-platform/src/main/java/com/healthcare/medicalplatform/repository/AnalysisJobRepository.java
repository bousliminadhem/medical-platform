package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.AnalysisJob;
import com.healthcare.medicalplatform.model.enums.AnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, UUID> {
    List<AnalysisJob> findByDocumentIdOrderByRequestedAtDesc(UUID documentId);
    List<AnalysisJob> findByDocumentId(UUID documentId);
    List<AnalysisJob> findTop5ByStatusOrderByRequestedAtAsc(AnalysisStatus status);
    boolean existsByDocumentIdAndStatusIn(UUID documentId, java.util.Collection<AnalysisStatus> statuses);
}
