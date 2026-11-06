package com.healthcare.medicalplatform.context;

import com.healthcare.medicalplatform.repository.AppointmentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * "Practitioners see the clinical information of the patients they treat":
 * a practitioner is linked to a patient once they share at least one appointment.
 */
@Component
public class AccessGuard {

    private final CurrentUser currentUser;
    private final AppointmentRepository appointments;

    public AccessGuard(CurrentUser currentUser, AppointmentRepository appointments) {
        this.currentUser = currentUser;
        this.appointments = appointments;
    }

    public boolean isPatientSelf(UUID patientId) {
        return currentUser.hasRole("PATIENT") && currentUser.id().filter(patientId::equals).isPresent();
    }

    public boolean practitionerHasAccess(UUID patientId) {
        return currentUser.hasRole("PRACTITIONER")
                && appointments.existsByPatientIdAndPractitionerId(patientId, currentUser.requireId());
    }

    /** Patient themself, or a treating practitioner. */
    public void requireClinicalAccess(UUID patientId) {
        if (!isPatientSelf(patientId) && !practitionerHasAccess(patientId)) {
            throw new AccessDeniedException("No access to this patient's clinical data");
        }
    }

    /** Treating practitioner only. */
    public void requirePractitionerAccess(UUID patientId) {
        if (!practitionerHasAccess(patientId)) {
            throw new AccessDeniedException("No access to this patient's clinical data");
        }
    }
}
