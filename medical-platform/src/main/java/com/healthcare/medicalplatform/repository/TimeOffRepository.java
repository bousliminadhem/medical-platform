package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.TimeOff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TimeOffRepository extends JpaRepository<TimeOff, UUID> {

    List<TimeOff> findByPractitionerId(UUID practitionerId);

    void deleteByPractitionerId(UUID practitionerId);

    @Query("""
            select count(t) > 0 from TimeOff t
            where t.practitioner.id = :pid and t.startAt < :end and t.endAt > :start
            """)
    boolean overlaps(@Param("pid") UUID practitionerId, @Param("start") Instant start,
                     @Param("end") Instant end);
}
