package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.Practitioner;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PractitionerRepository extends JpaRepository<Practitioner, UUID> {

    boolean existsByLicenseNumber(String licenseNumber);

    List<Practitioner> findByActiveTrueOrderByLastNameAsc();

    List<Practitioner> findAllByOrderByLastNameAsc();

    /** Serializes concurrent bookings for one practitioner (overlap protection, 3.6). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Practitioner p where p.id = :id")
    Optional<Practitioner> findByIdForUpdate(@Param("id") UUID id);
}