package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ScheduleDtos.*;
import com.healthcare.medicalplatform.services.PractitionerService;
import com.healthcare.medicalplatform.services.SchedulingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/practitioners")
public class ScheduleController {

    private final PractitionerService practitionerService;
    private final SchedulingService schedulingService;

    public ScheduleController(PractitionerService practitionerService, SchedulingService schedulingService) {
        this.practitionerService = practitionerService;
        this.schedulingService = schedulingService;
    }

    @GetMapping
    public List<PractitionerResponse> list(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return all ? practitionerService.listAll() : practitionerService.listActive();
    }

    @GetMapping("/{id}/slots")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER','MEDICAL_ASSISTANT')")
    public List<SlotResponse> slots(@PathVariable UUID id,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return schedulingService.availableSlots(id, date);
    }

    @GetMapping("/{id}/working-hours")
    public List<WorkingHoursResponse> workingHours(@PathVariable UUID id) {
        return schedulingService.getWorkingHours(id);
    }

    @PutMapping("/{id}/working-hours")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT','ADMIN')")
    public WorkingHoursResponse setWorkingHours(@PathVariable UUID id,
                                                @Valid @RequestBody WorkingHoursRequest request) {
        return schedulingService.setWorkingHours(id, request);
    }

    @PostMapping("/{id}/time-off")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT','ADMIN')")
    public ResponseEntity<Void> timeOff(@PathVariable UUID id, @Valid @RequestBody TimeOffRequest request) {
        schedulingService.addTimeOff(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** 3.1 activate / deactivate (administrator). */
    @PatchMapping("/{id}/active/{active}")
    @PreAuthorize("hasRole('ADMIN')")
    public PractitionerResponse setActive(@PathVariable UUID id, @PathVariable boolean active) {
        return practitionerService.setActive(id, active);
    }
}
