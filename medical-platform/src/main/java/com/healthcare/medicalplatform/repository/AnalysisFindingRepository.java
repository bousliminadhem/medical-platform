package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.AnalysisFinding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisFindingRepository extends JpaRepository<AnalysisFinding, Long> {
}
