package com.healthcare.medicalplatform.model.enums;

import com.healthcare.medicalplatform.common.BadRequestException;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public enum AppointmentStatus {
    SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW;

    /** Statuses that occupy the practitioner's time. */
    public static final List<AppointmentStatus> ACTIVE =
            List.of(SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED);

    private static final Map<AppointmentStatus, Set<AppointmentStatus>> NEXT = Map.of(
            SCHEDULED, EnumSet.of(CONFIRMED, CANCELLED),
            CONFIRMED, EnumSet.of(IN_PROGRESS, CANCELLED, NO_SHOW),
            IN_PROGRESS, EnumSet.of(COMPLETED));

    public boolean canMoveTo(AppointmentStatus next) {
        return NEXT.getOrDefault(this, Set.of()).contains(next);
    }

    public void requireMoveTo(AppointmentStatus next) {
        if (!canMoveTo(next)) {
            throw new BadRequestException("Illegal status change: " + this + " -> " + next);
        }
    }
}