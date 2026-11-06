package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    Optional<Consultation> findByAppointmentId(UUID appointmentId);
    List<Consultation> findByAppointmentPatientIdOrderByOpenedAtDesc(UUID patientId);
    List<Consultation> findByAppointmentPractitionerIdOrderByOpenedAtDesc(UUID practitionerId);
}
