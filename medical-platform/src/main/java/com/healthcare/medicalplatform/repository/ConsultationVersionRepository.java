package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.ConsultationVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsultationVersionRepository extends JpaRepository<ConsultationVersion, UUID> {
    List<ConsultationVersion> findByConsultationIdOrderByVersionNumberDesc(UUID consultationId);
    int countByConsultationId(UUID consultationId);
}
