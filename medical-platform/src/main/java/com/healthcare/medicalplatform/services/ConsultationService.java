package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.*;
import com.healthcare.medicalplatform.model.entity.Appointment;
import com.healthcare.medicalplatform.model.entity.Consultation;
import com.healthcare.medicalplatform.model.entity.ConsultationVersion;
import com.healthcare.medicalplatform.model.entity.PrescriptionItem;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.model.enums.ConsultationStatus;
import com.healthcare.medicalplatform.repository.AppointmentRepository;
import com.healthcare.medicalplatform.repository.ConsultationRepository;
import com.healthcare.medicalplatform.repository.ConsultationVersionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** M4. Writes: only the practitioner who owns the visit. Reads: treating practitioners, and the patient once CLOSED. */
@Service
public class ConsultationService {

    private final ConsultationRepository consultations;
    private final AppointmentRepository appointments;
    private final AccessGuard guard;
    private final AuditService auditService;
    private final CurrentUser currentUser;
    private final ConsultationVersionRepository versions;

    public ConsultationService(ConsultationRepository consultations, AppointmentRepository appointments,
                               AccessGuard guard, AuditService auditService, CurrentUser currentUser,
                               ConsultationVersionRepository versions) {
        this.consultations = consultations;
        this.appointments = appointments;
        this.guard = guard;
        this.auditService = auditService;
        this.currentUser = currentUser;
        this.versions = versions;
    }

    /** 4.1 start an encounter from a confirmed appointment (idempotent). */
    @Transactional
    public ConsultationResponse open(UUID appointmentId) {
        Appointment a = appointments.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found"));
        if (!a.getPractitioner().getId().equals(currentUser.requireId())) {
            throw new AccessDeniedException("Not your appointment");
        }
        Consultation existing = consultations.findByAppointmentId(appointmentId).orElse(null);
        if (existing != null) {
            return ConsultationResponse.from(existing);
        }
        if (a.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ConflictException("Appointment must be confirmed before a consultation can start");
        }
        a.transitionTo(AppointmentStatus.IN_PROGRESS);
        Consultation c = consultations.save(new Consultation(a));
        audit(AuditAction.CONSULTATION_OPENED, c, null);
        return ConsultationResponse.from(c);
    }

    /** 4.2 */
    @Transactional
    public ConsultationResponse recordNotes(UUID id, NotesRequest req) {
        Consultation c = loadOwnEditable(id);
        snapshot(c);
        c.setNotes(req.chiefComplaint(), req.physicalFindings(), req.diagnosis());
        return ConsultationResponse.from(c);
    }

    /** 4.3 */
    @Transactional
    public ConsultationResponse issuePrescription(UUID id, IssuePrescriptionRequest req) {
        Consultation c = loadOwnEditable(id);
        snapshot(c);
        c.getPrescription().clear();
        req.items().forEach(i -> c.getPrescription().add(
                new PrescriptionItem(i.medication().trim(), i.dosage().trim(), i.frequency().trim(), i.durationDays())));
        audit(AuditAction.PRESCRIPTION_ISSUED, c, req.items().size() + " item(s)");
        return ConsultationResponse.from(c);
    }

    /** 4.4 */
    @Transactional
    public ConsultationResponse defineFollowUp(UUID id, FollowUpRequest req) {
        Consultation c = loadOwnEditable(id);
        snapshot(c);
        c.setFollowUp(req.followUpDate(), req.routineChecks(), req.careInstructions());
        return ConsultationResponse.from(c);
    }

    /** 4.5 finalize and lock; the visit becomes COMPLETED. */
    @Transactional
    public ConsultationResponse close(UUID id) {
        Consultation c = loadOwnOpen(id);
        if (c.getDiagnosis() == null || c.getDiagnosis().isBlank()) {
            throw new BadRequestException("A final diagnosis is required to close the consultation");
        }
        snapshot(c);

        c.close();
        c.getAppointment().transitionTo(AppointmentStatus.COMPLETED);
        audit(AuditAction.CONSULTATION_CLOSED, c, null);
        return ConsultationResponse.from(c);
    }

    @Transactional(readOnly = true)
    public List<ConsultationVersionResponse> versions(UUID id) {
        Consultation c = consultations.findById(id).orElseThrow(() -> new NotFoundException("Consultation not found"));
        if (!c.getAppointment().getPractitioner().getId().equals(currentUser.requireId())) {
            throw new AccessDeniedException("Not your consultation");
        }
        return versions.findByConsultationIdOrderByVersionNumberDesc(id).stream()
                .map(ConsultationVersionResponse::from).toList();
    }

    /** 4.6 / 4.7 */
    @Transactional(readOnly = true)
    public ConsultationResponse view(UUID id) {
        Consultation c = consultations.findById(id).orElseThrow(() -> new NotFoundException("Consultation not found"));
        UUID patientId = c.getAppointment().getPatient().getId();
        boolean allowed = guard.practitionerHasAccess(patientId)
                || (guard.isPatientSelf(patientId) && c.getStatus() == ConsultationStatus.CLOSED);
        if (!allowed) {
            throw new AccessDeniedException("Access denied");
        }
        audit(AuditAction.RECORD_VIEWED, c, "consultation");
        return ConsultationResponse.from(c);
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> listForPatient(UUID patientId) {
        guard.requireClinicalAccess(patientId);
        boolean self = guard.isPatientSelf(patientId);
        return consultations.findByAppointmentPatientIdOrderByOpenedAtDesc(patientId).stream()
                .filter(c -> !self || c.getStatus() == ConsultationStatus.CLOSED)
                .map(ConsultationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultationResponse> listForPractitioner() {
        UUID practitionerId = currentUser.requireId();
        return consultations.findByAppointmentPractitionerIdOrderByOpenedAtDesc(practitionerId).stream()
                .map(ConsultationResponse::from).toList();
    }

    private Consultation loadOwnOpen(UUID id) {
        Consultation c = consultations.findById(id).orElseThrow(() -> new NotFoundException("Consultation not found"));
        if (!c.getAppointment().getPractitioner().getId().equals(currentUser.requireId())) {
            throw new AccessDeniedException("Not your consultation");
        }
        c.requireOpen();
        return c;
    }

    private Consultation loadOwnEditable(UUID id) {
        Consultation c = consultations.findById(id).orElseThrow(() -> new NotFoundException("Consultation not found"));
        if (!c.getAppointment().getPractitioner().getId().equals(currentUser.requireId())) {
            throw new AccessDeniedException("Not your consultation");
        }
        return c;
    }

    private void snapshot(Consultation c) {
        versions.save(new ConsultationVersion(c, versions.countByConsultationId(c.getId()) + 1));
    }

    private void audit(AuditAction action, Consultation c, String details) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), action, "Consultation", c.getId().toString(), details);
    }
}
