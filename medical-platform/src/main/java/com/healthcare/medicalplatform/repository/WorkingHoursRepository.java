package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, UUID> {
    Optional<WorkingHours> findByPractitionerIdAndDayOfWeek(UUID practitionerId, DayOfWeek day);
    List<WorkingHours> findByPractitionerIdOrderByDayOfWeek(UUID practitionerId);
}
