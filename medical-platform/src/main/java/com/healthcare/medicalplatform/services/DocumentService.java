package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.DocumentResponse;
import com.healthcare.medicalplatform.model.entity.*;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.ConsultationRepository;
import com.healthcare.medicalplatform.repository.DocumentRepository;
import com.healthcare.medicalplatform.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** M5 document archive. */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    /** Allowed types and the magic bytes their content must start with. */
    private static final Map<String, byte[]> MAGIC = Map.of(
            "application/pdf", "%PDF".getBytes(StandardCharsets.US_ASCII),
            "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'},
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

    public record DownloadedFile(Resource resource, String fileName, String contentType) {
    }

    private final DocumentRepository documents;
    private final PatientRepository patients;
    private final ConsultationRepository consultations;
    private final LookupService lookupService;
    private final AnalysisService analysisService;
    private final FileStorage storage;
    private final AccessGuard guard;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public DocumentService(DocumentRepository documents, PatientRepository patients,
                           ConsultationRepository consultations, LookupService lookupService,
                           AnalysisService analysisService, FileStorage storage, AccessGuard guard,
                           AuditService auditService, CurrentUser currentUser) {
        this.documents = documents;
        this.patients = patients;
        this.consultations = consultations;
        this.lookupService = lookupService;
        this.analysisService = analysisService;
        this.storage = storage;
        this.guard = guard;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    /** 5.1 (+5.2 classification, +5.4 optional link, +6.1 auto-queue for images). */
    @Transactional
    public DocumentResponse upload(UUID patientId, MultipartFile file, String typeCode, UUID consultationId)
            throws IOException {
        Patient patient = patients.findById(patientId).filter(p -> !p.isArchived())
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        authorizeUpload(patientId, consultationId != null);

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String contentType = file.getContentType();
        byte[] magic = contentType == null ? null : MAGIC.get(contentType);
        byte[] bytes = file.getBytes();
        if (magic == null || !startsWith(bytes, magic)) {
            throw new BadRequestException("Unsupported or mismatching file type (allowed: PDF, PNG, JPEG)");
        }
        LookupValue type = lookupService.resolve("DOCUMENT_TYPE", typeCode);
        if (type == null) {
            throw new BadRequestException("Document type is required");
        }
        Consultation consultation = null;
        if (consultationId != null) {
            consultation = consultations.findById(consultationId)
                    .filter(c -> c.getAppointment().getPatient().getId().equals(patientId)
                            && (!currentUser.hasRole("PRACTITIONER")
                            || c.getAppointment().getPractitioner().getId().equals(currentUser.requireId())))
                    .orElseThrow(() -> new BadRequestException("Consultation does not belong to this patient"));
        }

        String path = storage.store(patientId, bytes);
        UUID me = currentUser.requireId();
        Document doc = documents.save(new Document(patient, consultation, type, safeName(file.getOriginalFilename()),
                contentType, bytes.length, path, sha256(bytes), me));

        audit(AuditAction.DOCUMENT_UPLOADED, doc, null);
        if (contentType.startsWith("image/")) {
            analysisService.enqueue(doc);
        }
        return DocumentResponse.from(doc);
    }

    /** Medical assistants may not read documents (list/download are patient + practitioner only). */
    @Transactional(readOnly = true)
    public List<DocumentResponse> list(UUID patientId) {
        guard.requireClinicalAccess(patientId);
        return documents.findByPatientIdAndArchivedFalseOrderByUploadedAtDesc(patientId).stream()
                .map(DocumentResponse::from).toList();
    }

    /** 5.3 */
    @Transactional
    public DownloadedFile download(UUID id) {
        Document d = load(id);
        guard.requireClinicalAccess(d.getPatient().getId());
        audit(AuditAction.DOCUMENT_VIEWED, d, null);
        return new DownloadedFile(new FileSystemResource(storage.resolve(d.getStoragePath())),
                d.getOriginalName(), d.getContentType());
    }

    /** 5.2 practitioners reclassify any document; assistants only the ones they uploaded. */
    @Transactional
    public DocumentResponse classify(UUID id, String typeCode) {
        Document d = load(id);
        boolean ownUploadByAssistant = currentUser.hasRole("MEDICAL_ASSISTANT")
                && d.getUploadedBy().equals(currentUser.requireId());
        if (!ownUploadByAssistant) {
            guard.requirePractitionerAccess(d.getPatient().getId());
        }
        LookupValue type = lookupService.resolve("DOCUMENT_TYPE", typeCode);
        if (type == null) {
            throw new BadRequestException("Document type is required");
        }
        d.setType(type);
        audit(AuditAction.DOCUMENT_CHANGED, d, "classified as " + type.getCode());
        return DocumentResponse.from(d);
    }

    /** 5.4 */
    @Transactional
    public DocumentResponse linkToConsultation(UUID id, UUID consultationId) {
        Document d = load(id);
        guard.requirePractitionerAccess(d.getPatient().getId());
        Consultation c = consultations.findById(consultationId)
                .filter(x -> x.getAppointment().getPatient().getId().equals(d.getPatient().getId())
                        && (!currentUser.hasRole("PRACTITIONER")
                        || x.getAppointment().getPractitioner().getId().equals(currentUser.requireId())))
                .orElseThrow(() -> new BadRequestException("Consultation does not belong to this patient"));
        d.setConsultation(c);
        audit(AuditAction.DOCUMENT_CHANGED, d, "linked to consultation");
        return DocumentResponse.from(d);
    }

    /** 5.5 soft archive: the file and its trace stay on disk. */
    @Transactional
    public void archive(UUID id) {
        Document d = load(id);
        guard.requirePractitionerAccess(d.getPatient().getId());
        d.archive();
        audit(AuditAction.DOCUMENT_ARCHIVED, d, null);
    }

    /** 5.6 recompute every checksum; called by the nightly job (no authenticated user). */
    @Transactional
    public int verifyAll() {
        int failures = 0;
        for (Document d : documents.findByArchivedFalse()) {
            boolean ok;
            try {
                ok = sha256(Files.readAllBytes(storage.resolve(d.getStoragePath()))).equals(d.getSha256());
            } catch (IOException | RuntimeException ex) {
                ok = false;
            }
            if (!ok) {
                failures++;
                log.error("Integrity check failed for document {}", d.getId());
                auditService.record(null, "system", AuditAction.INTEGRITY_FAILURE, "Document",
                        d.getId().toString(), "checksum mismatch or file missing");
            }
        }
        return failures;
    }

    // ---------- internals ----------

    private void authorizeUpload(UUID patientId, boolean linking) {
        if (guard.isPatientSelf(patientId)) {
            if (linking) throw new AccessDeniedException("Patients cannot link documents to consultations");
            return;
        }
        if (currentUser.hasRole("PRACTITIONER")) {
            guard.requirePractitionerAccess(patientId);
            return;
        }
        if (currentUser.hasRole("MEDICAL_ASSISTANT")) {
            if (linking) throw new AccessDeniedException("Assistants cannot link documents to consultations");
            return;
        }
        throw new AccessDeniedException("Access denied");
    }

    private Document load(UUID id) {
        return documents.findById(id).filter(d -> !d.isArchived())
                .orElseThrow(() -> new NotFoundException("Document not found"));
    }

    private void audit(AuditAction action, Document d, String details) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), action, "Document", d.getId().toString(), details);
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }

    /** Display name only; the stored file name is generated. */
    private static String safeName(String name) {
        String n = name == null ? "file" : name.replaceAll("[\\\\/\\r\\n\\x00]", "_").trim();
        return n.isEmpty() ? "file" : n.substring(0, Math.min(255, n.length()));
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
