package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.DocumentDtos.AnalysisResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.FindingResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.ReviewRequest;
import com.healthcare.medicalplatform.services.AnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('PRACTITIONER')")
public class AnalysisController {

    private final AnalysisService service;

    public AnalysisController(AnalysisService service) {
        this.service = service;
    }

    @PostMapping("/documents/{documentId}/analysis")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AnalysisResponse request(@PathVariable UUID documentId) {
        return service.requestAnalysis(documentId);
    }

    @GetMapping("/documents/{documentId}/analysis")
    public List<AnalysisResponse> results(@PathVariable UUID documentId) {
        return service.forDocument(documentId);
    }

    @PutMapping("/analysis/findings/{findingId}")
    public FindingResponse review(@PathVariable Long findingId, @Valid @RequestBody ReviewRequest request) {
        return service.review(findingId, request.decision());
    }
}
