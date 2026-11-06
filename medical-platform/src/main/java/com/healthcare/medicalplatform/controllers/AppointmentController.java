package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ScheduleDtos.*;
import com.healthcare.medicalplatform.services.SchedulingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final SchedulingService service;

    public AppointmentController(SchedulingService service) {
        this.service = service;
    }

    /** 3.5 */
    @PostMapping("/request")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PATIENT')")
    public AppointmentResponse request(@Valid @RequestBody RequestAppointment request) {
        return service.request(request);
    }

    /** 3.6 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public AppointmentResponse book(@Valid @RequestBody BookAppointment request) {
        return service.book(request);
    }

    /** 3.10 daily/weekly calendar: pass from/to (same day = daily view). */
    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER','MEDICAL_ASSISTANT')")
    public List<AppointmentResponse> agenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID practitionerId) {
        return service.agenda(from, to, practitionerId);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public AppointmentResponse confirm(@PathVariable UUID id) {
        return service.confirm(id);
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER','MEDICAL_ASSISTANT')")
    public AppointmentResponse reschedule(@PathVariable UUID id, @Valid @RequestBody RescheduleRequest request) {
        return service.reschedule(id, request.newStartAt());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER','MEDICAL_ASSISTANT')")
    public AppointmentResponse cancel(@PathVariable UUID id, @Valid @RequestBody CancelRequest request) {
        return service.cancel(id, request.reason());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public AppointmentResponse status(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(id, request.status());
    }
}
