package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    boolean existsByNationalId(String nationalId);

    @EntityGraph(attributePaths = {"gender", "bloodType"})
    List<Patient> findByArchivedOrderByLastNameAscFirstNameAsc(boolean archived);

    /**
     * 2.2 search by name, date of birth (yyyy-MM-dd), phone or national id; archived records excluded.
     * Pass an empty string (not null) to list everything.
     */
    @Query("""
            select p from Patient p
            where p.archived = false
              and (lower(p.firstName) like lower(concat('%', :q, '%'))
                   or lower(p.lastName) like lower(concat('%', :q, '%'))
                   or p.phone like concat('%', :q, '%')
                   or p.nationalId = :q
                   or cast(p.dateOfBirth as string) = :q)
            """)
    @EntityGraph(attributePaths = {"gender", "bloodType"})
    Page<Patient> search(@Param("q") String query, Pageable pageable);

    /**
     * Restricts the practitioner directory to patients linked through an appointment.
     */
    @Query("""
            select distinct p from Patient p
            where p.archived = false
              and exists (
                  select a.id from Appointment a
                  where a.patient.id = p.id
                    and a.practitioner.id = :practitionerId
              )
              and (lower(p.firstName) like lower(concat('%', :q, '%'))
                   or lower(p.lastName) like lower(concat('%', :q, '%'))
                   or p.phone like concat('%', :q, '%')
                   or p.nationalId = :q
                   or cast(p.dateOfBirth as string) = :q)
            """)
    @EntityGraph(attributePaths = {"gender", "bloodType"})
    Page<Patient> searchForPractitioner(@Param("q") String query,
                                        @Param("practitionerId") UUID practitionerId,
                                        Pageable pageable);
}
