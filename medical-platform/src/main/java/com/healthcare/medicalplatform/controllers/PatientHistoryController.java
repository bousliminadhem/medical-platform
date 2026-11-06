package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundResponse;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.TimelineEntry;
import com.healthcare.medicalplatform.services.HealthBackgroundService;
import com.healthcare.medicalplatform.services.TimelineService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients/{patientId}")
@PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER')")
public class PatientHistoryController {

    private final HealthBackgroundService backgroundService;
    private final TimelineService timelineService;

    public PatientHistoryController(HealthBackgroundService backgroundService, TimelineService timelineService) {
        this.backgroundService = backgroundService;
        this.timelineService = timelineService;
    }

    @GetMapping("/background")
    public HealthBackgroundResponse background(@PathVariable UUID patientId) {
        return backgroundService.get(patientId);
    }

    @PutMapping("/background")
    public HealthBackgroundResponse updateBackground(@PathVariable UUID patientId,
                                                     @Valid @RequestBody HealthBackgroundRequest request) {
        return backgroundService.update(patientId, request);
    }

    @GetMapping("/timeline")
    public List<TimelineEntry> timeline(@PathVariable UUID patientId) {
        return timelineService.timeline(patientId);
    }
}
