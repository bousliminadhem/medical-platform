package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.DocumentDtos.*;
import com.healthcare.medicalplatform.services.DocumentService;
import com.healthcare.medicalplatform.services.DocumentService.DownloadedFile;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @PostMapping(path = "/patients/{patientId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER','MEDICAL_ASSISTANT')")
    public DocumentResponse upload(@PathVariable UUID patientId,
                                   @RequestPart("file") MultipartFile file,
                                   @RequestParam("type") String type,
                                   @RequestParam(value = "consultationId", required = false) UUID consultationId)
            throws IOException {
        return service.upload(patientId, file, type, consultationId);
    }

    @GetMapping("/patients/{patientId}/documents")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER')")
    public List<DocumentResponse> list(@PathVariable UUID patientId) {
        return service.list(patientId);
    }

    @GetMapping("/documents/{id}/download")
    @PreAuthorize("hasAnyRole('PATIENT','PRACTITIONER')")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        DownloadedFile f = service.download(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(f.fileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(f.resource());
    }

    @PutMapping("/documents/{id}/type")
    @PreAuthorize("hasAnyRole('PRACTITIONER','MEDICAL_ASSISTANT')")
    public DocumentResponse classify(@PathVariable UUID id, @Valid @RequestBody ClassifyRequest request) {
        return service.classify(id, request.typeCode());
    }

    @PutMapping("/documents/{id}/consultation")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public DocumentResponse link(@PathVariable UUID id, @Valid @RequestBody LinkRequest request) {
        return service.linkToConsultation(id, request.consultationId());
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<Void> archive(@PathVariable UUID id) {
        service.archive(id);
        return ResponseEntity.noContent().build();
    }
}
