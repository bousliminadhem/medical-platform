package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.AnalysisResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.FindingResponse;
import com.healthcare.medicalplatform.model.entity.AnalysisFinding;
import com.healthcare.medicalplatform.model.entity.AnalysisJob;
import com.healthcare.medicalplatform.model.entity.Document;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AnalysisStatus;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.model.enums.FindingDecision;
import com.healthcare.medicalplatform.repository.AnalysisFindingRepository;
import com.healthcare.medicalplatform.repository.AnalysisJobRepository;
import com.healthcare.medicalplatform.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** M6 queue, processing and review. Results are suggestions until a practitioner validates them. */
@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final AnalysisJobRepository jobs;
    private final AnalysisFindingRepository findings;
    private final DocumentRepository documents;
    private final DiagnosticEngine engine;
    private final FileStorage storage;
    private final AccessGuard guard;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public AnalysisService(AnalysisJobRepository jobs, AnalysisFindingRepository findings,
                           DocumentRepository documents, DiagnosticEngine engine, FileStorage storage,
                           AccessGuard guard, AuditService auditService, CurrentUser currentUser) {
        this.jobs = jobs;
        this.findings = findings;
        this.documents = documents;
        this.engine = engine;
        this.storage = storage;
        this.guard = guard;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    /** 6.1 automatic (on upload). Joins the caller's transaction. */
    @Transactional
    public void enqueue(Document document) {
        jobs.save(new AnalysisJob(document));
    }

    /** 6.1 on request. */
    @Transactional
    public AnalysisResponse requestAnalysis(UUID documentId) {
        Document d = documents.findById(documentId).filter(x -> !x.isArchived())
                .orElseThrow(() -> new NotFoundException("Document not found"));
        guard.requirePractitionerAccess(d.getPatient().getId());
        if (jobs.existsByDocumentIdAndStatusIn(documentId, Set.of(AnalysisStatus.QUEUED, AnalysisStatus.PROCESSING))) {
            throw new ConflictException("An analysis is already queued or running for this document");
        }
        return AnalysisResponse.from(jobs.save(new AnalysisJob(d)));
    }

    /** 6.2 / 6.4 status and insights, newest first. */
    @Transactional(readOnly = true)
    public List<AnalysisResponse> forDocument(UUID documentId) {
        Document d = documents.findById(documentId).orElseThrow(() -> new NotFoundException("Document not found"));
        guard.requirePractitionerAccess(d.getPatient().getId());
        return jobs.findByDocumentIdOrderByRequestedAtDesc(documentId).stream().map(AnalysisResponse::from).toList();
    }

    /** 6.5 */
    @Transactional
    public FindingResponse review(Long findingId, FindingDecision decision) {
        if (decision == FindingDecision.PENDING) {
            throw new BadRequestException("Decision must be VALIDATED or DISMISSED");
        }
        AnalysisFinding f = findings.findById(findingId).orElseThrow(() -> new NotFoundException("Finding not found"));
        UUID patientId = f.getJob().getDocument().getPatient().getId();
        guard.requirePractitionerAccess(patientId);
        f.review(decision, currentUser.requireId());
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.FINDING_REVIEWED, "AnalysisFinding",
                findingId.toString(), decision.name());
        return FindingResponse.from(f);
    }

    /**
     * 6.3 called by the scheduler (no authenticated user). Runs single-instance; for multiple
     * instances add SELECT ... FOR UPDATE SKIP LOCKED on the queued jobs.
     */
    @Transactional
    public void processPending() {
        for (AnalysisJob job : jobs.findTop5ByStatusOrderByRequestedAtAsc(AnalysisStatus.QUEUED)) {
            job.start();
            try {
                Document d = job.getDocument();
                var result = engine.analyze(storage.resolve(d.getStoragePath()), d.getContentType());
                result.findings().forEach(f ->
                        job.addFinding(new AnalysisFinding(job, f.label(), f.confidence(), f.annotation())));
                job.complete();
            } catch (Exception ex) {
                log.warn("Analysis {} failed: {}", job.getId(), ex.getMessage());
                job.fail(ex.getMessage());
            }
        }
    }
}
