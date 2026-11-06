package com.healthcare.medicalplatform.model.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AppointmentStatusTest {

    @Test
    void pendingRequestsOccupyPractitionerSlots() {
        assertTrue(AppointmentStatus.ACTIVE.contains(AppointmentStatus.SCHEDULED));
        assertTrue(AppointmentStatus.ACTIVE.contains(AppointmentStatus.CONFIRMED));
    }
}
