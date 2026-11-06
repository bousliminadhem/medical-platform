package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.HealthBackground;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HealthBackgroundRepository extends JpaRepository<HealthBackground, UUID> {
    Optional<HealthBackground> findByPatientId(UUID patientId);
}
