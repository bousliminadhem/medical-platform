package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.TimelineEntry;
import com.healthcare.medicalplatform.model.enums.ConsultationStatus;
import com.healthcare.medicalplatform.repository.AppointmentRepository;
import com.healthcare.medicalplatform.repository.ConsultationRepository;
import com.healthcare.medicalplatform.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/** 2.5 chronological summary of visits, diagnoses and documents. */
@Service
public class TimelineService {

    private final AppointmentRepository appointments;
    private final ConsultationRepository consultations;
    private final DocumentRepository documents;
    private final AccessGuard guard;

    public TimelineService(AppointmentRepository appointments, ConsultationRepository consultations,
                           DocumentRepository documents, AccessGuard guard) {
        this.appointments = appointments;
        this.consultations = consultations;
        this.documents = documents;
        this.guard = guard;
    }

    @Transactional(readOnly = true)
    public List<TimelineEntry> timeline(UUID patientId) {
        guard.requireClinicalAccess(patientId);
        boolean self = guard.isPatientSelf(patientId);
        List<TimelineEntry> out = new ArrayList<>();

        appointments.findByPatientIdOrderByStartAtDesc(patientId).forEach(a ->
                out.add(new TimelineEntry(a.getStartAt(), "APPOINTMENT", a.getStatus().name(), a.getId().toString())));

        consultations.findByAppointmentPatientIdOrderByOpenedAtDesc(patientId).stream()
                .filter(c -> !self || c.getStatus() == ConsultationStatus.CLOSED)
                .forEach(c -> out.add(new TimelineEntry(
                        c.getClosedAt() != null ? c.getClosedAt() : c.getOpenedAt(), "CONSULTATION",
                        c.getDiagnosis() == null ? "Consultation" : c.getDiagnosis(), c.getId().toString())));

        documents.findByPatientIdAndArchivedFalseOrderByUploadedAtDesc(patientId).forEach(d ->
                out.add(new TimelineEntry(d.getUploadedAt(), "DOCUMENT", d.getOriginalName(), d.getId().toString())));

        out.sort(Comparator.comparing(TimelineEntry::at).reversed());
        return out;
    }
}
