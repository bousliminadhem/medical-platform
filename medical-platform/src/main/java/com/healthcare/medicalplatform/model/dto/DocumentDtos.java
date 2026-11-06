package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.AnalysisFinding;
import com.healthcare.medicalplatform.model.entity.AnalysisJob;
import com.healthcare.medicalplatform.model.entity.Document;
import com.healthcare.medicalplatform.model.enums.AnalysisStatus;
import com.healthcare.medicalplatform.model.enums.FindingDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class DocumentDtos {

    private DocumentDtos() {
    }

    public record DocumentResponse(UUID id, UUID patientId, UUID consultationId, String type, String fileName,
                                   String contentType, long sizeBytes, Instant uploadedAt) {
        public static DocumentResponse from(Document d) {
            return new DocumentResponse(d.getId(), d.getPatient().getId(),
                    d.getConsultation() == null ? null : d.getConsultation().getId(),
                    d.getType().getCode(), d.getOriginalName(), d.getContentType(),
                    d.getSizeBytes(), d.getUploadedAt());
        }
    }

    public record ClassifyRequest(@NotBlank String typeCode) {
    }

    public record LinkRequest(@NotNull UUID consultationId) {
    }

    public record ReviewRequest(@NotNull FindingDecision decision) {
    }

    public record FindingResponse(Long id, String label, double confidence, String annotation,
                                  FindingDecision decision) {
        public static FindingResponse from(AnalysisFinding f) {
            return new FindingResponse(f.getId(), f.getLabel(), f.getConfidence(), f.getAnnotation(),
                    f.getDecision());
        }
    }

    public record AnalysisResponse(UUID jobId, UUID documentId, AnalysisStatus status, Instant requestedAt,
                                   Instant completedAt, String error, List<FindingResponse> findings) {
        public static AnalysisResponse from(AnalysisJob j) {
            return new AnalysisResponse(j.getId(), j.getDocument().getId(), j.getStatus(), j.getRequestedAt(),
                    j.getCompletedAt(), j.getErrorMessage(),
                    j.getFindings().stream().map(FindingResponse::from).toList());
        }
    }
}
