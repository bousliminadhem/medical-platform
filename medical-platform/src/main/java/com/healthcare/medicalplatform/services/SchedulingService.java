package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.config.ClinicProperties;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.*;
import com.healthcare.medicalplatform.model.entity.*;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** M3: availability, booking workflow, visit lifecycle, agenda. */
@Service
public class SchedulingService {

    private static final long MAX_AGENDA_DAYS = 62;

    private record Slot(Instant start, Instant end) {
    }

    private final AppointmentRepository appointments;
    private final PractitionerRepository practitioners;
    private final PatientRepository patients;
    private final WorkingHoursRepository workingHours;
    private final TimeOffRepository timeOff;
    private final AuditService auditService;
    private final CurrentUser currentUser;
    private final ZoneId zone;

    public SchedulingService(AppointmentRepository appointments, PractitionerRepository practitioners,
                             PatientRepository patients, WorkingHoursRepository workingHours,
                             TimeOffRepository timeOff, AuditService auditService, CurrentUser currentUser,
                             ClinicProperties clinic) {
        this.appointments = appointments;
        this.practitioners = practitioners;
        this.patients = patients;
        this.workingHours = workingHours;
        this.timeOff = timeOff;
        this.auditService = auditService;
        this.currentUser = currentUser;
        this.zone = clinic.zone();
    }

    // ---------- 3.2 / 3.3 schedule management ----------

    @Transactional(readOnly = true)
    public List<WorkingHoursResponse> getWorkingHours(UUID practitionerId) {
        return workingHours.findByPractitionerIdOrderByDayOfWeek(practitionerId).stream()
                .map(WorkingHoursResponse::from).toList();
    }

    @Transactional
    public WorkingHoursResponse setWorkingHours(UUID practitionerId, WorkingHoursRequest req) {
        assertCanManageSchedule(practitionerId);
        if (!req.endTime().isAfter(req.startTime())) {
            throw new BadRequestException("endTime must be after startTime");
        }
        if ((req.breakStart() == null) != (req.breakEnd() == null)) {
            throw new BadRequestException("breakStart and breakEnd must be provided together");
        }
        if (req.breakStart() != null && (!req.breakEnd().isAfter(req.breakStart())
                || req.breakStart().isBefore(req.startTime()) || req.breakEnd().isAfter(req.endTime()))) {
            throw new BadRequestException("Break must lie inside working hours");
        }
        Practitioner p = practitioner(practitionerId);
        WorkingHours wh = workingHours.findByPractitionerIdAndDayOfWeek(practitionerId, req.dayOfWeek())
                .orElseGet(() -> new WorkingHours(p, req.dayOfWeek()));
        wh.set(req.startTime(), req.endTime(), req.breakStart(), req.breakEnd(), req.slotMinutes());
        return WorkingHoursResponse.from(workingHours.save(wh));
    }

    @Transactional
    public void addTimeOff(UUID practitionerId, TimeOffRequest req) {
        assertCanManageSchedule(practitionerId);
        if (!req.endAt().isAfter(req.startAt())) {
            throw new BadRequestException("endAt must be after startAt");
        }
        timeOff.save(new TimeOff(practitioner(practitionerId), req.startAt(), req.endAt(), req.reason()));
    }

    // ---------- 3.4 slots ----------

    @Transactional(readOnly = true)
    public List<SlotResponse> availableSlots(UUID practitionerId, LocalDate date) {
        return computeSlots(practitioner(practitionerId), date, null).stream()
                .map(s -> new SlotResponse(s.start(), s.end())).toList();
    }

    // ---------- 3.5 / 3.6 requesting and booking ----------

    /** 3.5 patient requests a slot; stays SCHEDULED until staff confirm it. */
    @Transactional
    public AppointmentResponse request(RequestAppointment req) {
        Patient patient = activePatient(currentUser.requireId());
        return create(patient, req.practitionerId(), req.startAt(), req.reason(), AppointmentStatus.SCHEDULED);
    }

    /** 3.6 staff book directly; already CONFIRMED. */
    @Transactional
    public AppointmentResponse book(BookAppointment req) {
        if (currentUser.hasRole("PRACTITIONER") && !currentUser.requireId().equals(req.practitionerId())) {
            throw new AccessDeniedException("Practitioners can only book on their own agenda");
        }
        return create(activePatient(req.patientId()), req.practitionerId(), req.startAt(), req.reason(),
                AppointmentStatus.CONFIRMED);
    }

    // ---------- 3.7 / 3.8 / 3.9 lifecycle ----------

    @Transactional
    public AppointmentResponse confirm(UUID id) {
        Appointment a = load(id);
        assertCanAccess(a, false);
        a.transitionTo(AppointmentStatus.CONFIRMED);
        audit(a, "confirmed");
        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse reschedule(UUID id, Instant newStart) {
        Appointment a = load(id);
        assertCanAccess(a, true);
        if (a.getStatus() != AppointmentStatus.SCHEDULED && a.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only scheduled or confirmed appointments can be moved");
        }
        Practitioner p = practitioners.findByIdForUpdate(a.getPractitioner().getId())
                .orElseThrow(() -> new NotFoundException("Practitioner not found"));
        Slot slot = resolveSlot(p, newStart, a.getId());
        boolean byPatient = currentUser.hasRole("PATIENT");
        // A patient-initiated move needs staff confirmation again.
        a.reschedule(slot.start(), slot.end(), byPatient ? AppointmentStatus.SCHEDULED : a.getStatus());
        audit(a, "rescheduled");
        return AppointmentResponse.from(a);
    }

    @Transactional
    public AppointmentResponse cancel(UUID id, String reason) {
        Appointment a = load(id);
        assertCanAccess(a, true);
        a.cancel(reason);
        audit(a, "cancelled");
        return AppointmentResponse.from(a);
    }

    /** 3.9 manual status change by staff (cancellation has its own endpoint because it needs a reason). */
    @Transactional
    public AppointmentResponse updateStatus(UUID id, AppointmentStatus status) {
        if (status == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Use the cancel endpoint to cancel with a reason");
        }
        Appointment a = load(id);
        assertCanAccess(a, false);
        a.transitionTo(status);
        audit(a, "status -> " + status);
        return AppointmentResponse.from(a);
    }

    // ---------- 3.10 agenda ----------

    @Transactional(readOnly = true)
    public List<AppointmentResponse> agenda(LocalDate from, LocalDate to, UUID practitionerId) {
        if (to.isBefore(from) || Duration.between(from.atStartOfDay(), to.atStartOfDay()).toDays() > MAX_AGENDA_DAYS) {
            throw new BadRequestException("Invalid date range (max " + MAX_AGENDA_DAYS + " days)");
        }
        Instant start = from.atStartOfDay(zone).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(zone).toInstant();
        UUID me = currentUser.requireId();

        List<Appointment> result;
        if (currentUser.hasRole("PATIENT")) {
            result = appointments.findByPatientIdAndStartAtBetweenOrderByStartAt(me, start, end);
        } else if (currentUser.hasRole("PRACTITIONER")) {
            result = appointments.findByPractitionerIdAndStartAtBetweenOrderByStartAt(me, start, end);
        } else if (practitionerId != null) {
            result = appointments.findByPractitionerIdAndStartAtBetweenOrderByStartAt(practitionerId, start, end);
        } else {
            result = appointments.findByStartAtBetweenOrderByStartAt(start, end);
        }
        return result.stream().map(AppointmentResponse::from).toList();
    }

    // ---------- internals ----------

    private AppointmentResponse create(Patient patient, UUID practitionerId, Instant startAt, String reason,
                                       AppointmentStatus status) {
        // Row lock on the practitioner serializes concurrent bookings -> no double booking.
        Practitioner p = practitioners.findByIdForUpdate(practitionerId)
                .filter(Practitioner::isActive)
                .orElseThrow(() -> new NotFoundException("Practitioner not found"));
        Slot slot = resolveSlot(p, startAt, null);
        Appointment saved = appointments.save(
                new Appointment(patient, p, slot.start(), slot.end(), status, reason));
        audit(saved, "created as " + status);
        return AppointmentResponse.from(saved);
    }

    private Slot resolveSlot(Practitioner p, Instant start, UUID excludeAppointmentId) {
        LocalDate date = start.atZone(zone).toLocalDate();
        return computeSlots(p, date, excludeAppointmentId).stream()
                .filter(s -> s.start().equals(start))
                .findFirst()
                .orElseThrow(() -> new ConflictException("Requested time is not an available slot"));
    }

    private List<Slot> computeSlots(Practitioner p, LocalDate date, UUID excludeAppointmentId) {
        WorkingHours wh = workingHours.findByPractitionerIdAndDayOfWeek(p.getId(), date.getDayOfWeek()).orElse(null);
        if (wh == null || !p.isActive()) {
            return List.of();
        }
        Instant now = Instant.now();
        List<Slot> slots = new ArrayList<>();
        LocalTime t = wh.getStartTime();
        int len = wh.getSlotMinutes();
        while (!t.plusMinutes(len).isAfter(wh.getEndTime())) {
            LocalTime e = t.plusMinutes(len);
            boolean inBreak = wh.getBreakStart() != null
                    && t.isBefore(wh.getBreakEnd()) && e.isAfter(wh.getBreakStart());
            if (!inBreak) {
                Instant s = date.atTime(t).atZone(zone).toInstant();
                Instant en = date.atTime(e).atZone(zone).toInstant();
                if (s.isAfter(now) && !isBusy(p.getId(), s, en, excludeAppointmentId)) {
                    slots.add(new Slot(s, en));
                }
            }
            t = e;
        }
        return slots;
    }

    private boolean isBusy(UUID practitionerId, Instant start, Instant end, UUID excludeId) {
        boolean booked = excludeId == null
                ? appointments.overlaps(practitionerId, start, end, AppointmentStatus.ACTIVE)
                : appointments.overlapsExcluding(practitionerId, start, end, AppointmentStatus.ACTIVE, excludeId);
        return booked || timeOff.overlaps(practitionerId, start, end);
    }

    private void assertCanManageSchedule(UUID practitionerId) {
        if (currentUser.hasRole("MEDICAL_ASSISTANT") || currentUser.hasRole("ADMIN")) return;
        if (currentUser.hasRole("PRACTITIONER") && currentUser.requireId().equals(practitionerId)) return;
        throw new AccessDeniedException("Cannot manage this schedule");
    }

    private void assertCanAccess(Appointment a, boolean allowPatient) {
        UUID me = currentUser.requireId();
        if (currentUser.hasRole("MEDICAL_ASSISTANT") || currentUser.hasRole("ADMIN")) return;
        if (currentUser.hasRole("PRACTITIONER") && a.getPractitioner().getId().equals(me)) return;
        if (allowPatient && currentUser.hasRole("PATIENT") && a.getPatient().getId().equals(me)) return;
        throw new AccessDeniedException("Access denied");
    }

    private Appointment load(UUID id) {
        return appointments.findById(id).orElseThrow(() -> new NotFoundException("Appointment not found"));
    }

    private Practitioner practitioner(UUID id) {
        return practitioners.findById(id).orElseThrow(() -> new NotFoundException("Practitioner not found"));
    }

    private Patient activePatient(UUID id) {
        return patients.findById(id).filter(p -> !p.isArchived())
                .orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    private void audit(Appointment a, String what) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.APPOINTMENT_CHANGED, "Appointment",
                a.getId() == null ? null : a.getId().toString(), what);
    }
}
