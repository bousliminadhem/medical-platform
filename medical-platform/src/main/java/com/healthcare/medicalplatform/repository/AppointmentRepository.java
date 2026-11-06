package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.Appointment;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("""
            select count(a) > 0 from Appointment a
            where a.practitioner.id = :pid and a.status in :active
              and a.startAt < :end and a.endAt > :start
            """)
    boolean overlaps(@Param("pid") UUID practitionerId, @Param("start") Instant start,
                     @Param("end") Instant end, @Param("active") Collection<AppointmentStatus> active);

    @Query("""
            select count(a) > 0 from Appointment a
            where a.practitioner.id = :pid and a.status in :active
              and a.startAt < :end and a.endAt > :start and a.id <> :excludeId
            """)
    boolean overlapsExcluding(@Param("pid") UUID practitionerId, @Param("start") Instant start,
                              @Param("end") Instant end, @Param("active") Collection<AppointmentStatus> active,
                              @Param("excludeId") UUID excludeId);

    List<Appointment> findByPractitionerId(UUID practitionerId);

    List<Appointment> findByPractitionerIdAndStartAtBetweenOrderByStartAt(UUID practitionerId, Instant from, Instant to);

    List<Appointment> findByPatientIdAndStartAtBetweenOrderByStartAt(UUID patientId, Instant from, Instant to);

    List<Appointment> findByStartAtBetweenOrderByStartAt(Instant from, Instant to);

    List<Appointment> findByPatientIdOrderByStartAtDesc(UUID patientId);

    List<Appointment> findByPatientId(UUID patientId);

    List<Appointment> findByStatusInAndReminderSentFalseAndStartAtBetween(
            Collection<AppointmentStatus> statuses, Instant from, Instant to);

    long countByPractitionerIdAndStatusInAndStartAtBetween(
            UUID practitionerId, Collection<AppointmentStatus> statuses, Instant from, Instant to);

    /** Basis for "practitioners see the patients they treat". */
    boolean existsByPatientIdAndPractitionerId(UUID patientId, UUID practitionerId);
}
