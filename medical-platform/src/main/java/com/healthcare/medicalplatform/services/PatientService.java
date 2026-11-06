package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.context.AccessGuard;
import com.healthcare.medicalplatform.model.dto.PatientDtos.UpdatePatientRequest;
import com.healthcare.medicalplatform.model.dto.PatientDtos.CreatePatientRequest;
import com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse;
import com.healthcare.medicalplatform.model.entity.Appointment;
import com.healthcare.medicalplatform.model.entity.Consultation;
import com.healthcare.medicalplatform.model.entity.Document;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.PatientRepository;
import com.healthcare.medicalplatform.repository.AppointmentRepository;
import com.healthcare.medicalplatform.repository.ConsultationRepository;
import com.healthcare.medicalplatform.repository.DocumentRepository;
import com.healthcare.medicalplatform.repository.AnalysisJobRepository;
import com.healthcare.medicalplatform.repository.HealthBackgroundRepository;
import com.healthcare.medicalplatform.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** M2 Patient Directory. Field-level visibility is decided in the controller via the DTO chosen. */
@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final LookupService lookupService;
    private final AuditService auditService;
    private final CurrentUser currentUser;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final DocumentRepository documentRepository;
    private final AnalysisJobRepository analysisJobRepository;
    private final HealthBackgroundRepository healthBackgroundRepository;
    private final UserRepository userRepository;
    private final AccessGuard accessGuard;

    public PatientService(PatientRepository patientRepository, LookupService lookupService,
                          AuditService auditService, CurrentUser currentUser,
                          PasswordEncoder passwordEncoder, AppointmentRepository appointmentRepository,
                          ConsultationRepository consultationRepository, DocumentRepository documentRepository,
                          AnalysisJobRepository analysisJobRepository, HealthBackgroundRepository healthBackgroundRepository,
                          UserRepository userRepository, AccessGuard accessGuard) {
        this.patientRepository = patientRepository;
        this.lookupService = lookupService;
        this.auditService = auditService;
        this.currentUser = currentUser;
        this.passwordEncoder = passwordEncoder;
        this.appointmentRepository = appointmentRepository;
        this.consultationRepository = consultationRepository;
        this.documentRepository = documentRepository;
        this.analysisJobRepository = analysisJobRepository;
        this.healthBackgroundRepository = healthBackgroundRepository;
        this.userRepository = userRepository;
        this.accessGuard = accessGuard;
    }

    /** 2.3 view own profile (patient). */
    @Transactional(readOnly = true)
    public Patient getOwn() {
        return load(currentUser.requireId());
    }

    @Transactional(readOnly = true)
    public PatientResponse getOwnResponse() {
        return PatientResponse.from(load(currentUser.requireId()));
    }

    /** 2.3 view any profile (practitioner / assistant). Reads of patient data are audited. */
    @Transactional(readOnly = true)
    public Patient get(UUID id) {
        requirePractitionerPatientAccess(id);
        Patient patient = load(id);
        auditRead(AuditAction.RECORD_VIEWED, id.toString(), "profile");
        return patient;
    }

    @Transactional(readOnly = true)
    public PatientResponse getResponse(UUID id) {
        requirePractitionerPatientAccess(id);
        Patient patient = load(id);
        auditRead(AuditAction.RECORD_VIEWED, id.toString(), "profile");
        return PatientResponse.from(patient);
    }

    /** 2.2 search. */
    @Transactional(readOnly = true)
    public Page<Patient> search(String query, Pageable pageable) {
        String q = query == null ? "" : query.trim();
        auditRead(AuditAction.RECORD_SEARCHED, null, q.isEmpty() ? "list all" : "query");
        if (currentUser.hasRole("PRACTITIONER")) {
            return patientRepository.searchForPractitioner(q, currentUser.requireId(), pageable);
        }
        return patientRepository.search(q, pageable);
    }

    /** 2.1 update profile. Patients edit their own; assistants/practitioners edit a given patient. */
    @Transactional
    public Patient update(UUID id, UpdatePatientRequest req) {
        requirePractitionerPatientAccess(id);
        Patient p = load(id);
        if (req.email() != null && !req.email().isBlank()) {
            String email = req.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(p.getEmail()) && userRepository.existsByEmailIgnoreCase(email)) {
                throw new com.healthcare.medicalplatform.common.ConflictException("Email already registered");
            }
            p.setEmail(email);
        }
        if (req.firstName() != null) p.setFirstName(req.firstName().trim());
        if (req.lastName() != null) p.setLastName(req.lastName().trim());
        if (req.dateOfBirth() != null) p.setDateOfBirth(req.dateOfBirth());
        if (req.phone() != null) p.setPhone(req.phone());
        if (req.address() != null) p.setAddress(req.address());
        if (req.emergencyContactName() != null) p.setEmergencyContactName(req.emergencyContactName());
        if (req.emergencyContactPhone() != null) p.setEmergencyContactPhone(req.emergencyContactPhone());
        if (req.insuranceProvider() != null) p.setInsuranceProvider(req.insuranceProvider());
        if (req.insuranceNumber() != null) p.setInsuranceNumber(req.insuranceNumber());
        if (req.genderCode() != null) p.setGender(lookupService.resolve("GENDER", req.genderCode()));
        if (req.bloodTypeCode() != null) p.setBloodType(lookupService.resolve("BLOOD_TYPE", req.bloodTypeCode()));
        auditRead(AuditAction.PROFILE_UPDATED, id.toString(), "patient profile");
        return p;
    }

    @Transactional
    public PatientResponse updateResponse(UUID id, UpdatePatientRequest req) {
        return PatientResponse.from(update(id, req));
    }

    private void requirePractitionerPatientAccess(UUID patientId) {
        if (currentUser.hasRole("PRACTITIONER")) {
            accessGuard.requirePractitionerAccess(patientId);
        }
    }

    /** 2.6 soft delete, administrator only (enforced on the controller). */
    @Transactional
    public void archive(UUID id) {
        Patient p = load(id);
        p.archive();
        auditRead(AuditAction.RECORD_ARCHIVED, id.toString(), "patient archived");
    }

    @Transactional(readOnly = true)
    public java.util.List<com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse> listResponses(
            boolean archived) {
        return patientRepository.findByArchivedOrderByLastNameAscFirstNameAsc(archived)
                .stream()
                .map(com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse::from)
                .toList();
    }

    @Transactional
    public Patient create(CreatePatientRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new com.healthcare.medicalplatform.common.ConflictException("Email already registered");
        }
        Patient p = new Patient(email, passwordEncoder.encode(req.temporaryPassword()),
                req.firstName().trim(), req.lastName().trim(), req.dateOfBirth());
        p.setPhone(req.phone());
        p.setNationalId(req.nationalId());
        p.setAddress(req.address());
        p.setEmergencyContactName(req.emergencyContactName());
        p.setEmergencyContactPhone(req.emergencyContactPhone());
        p.setInsuranceProvider(req.insuranceProvider());
        p.setInsuranceNumber(req.insuranceNumber());
        if (req.genderCode() != null && !req.genderCode().isBlank()) {
            p.setGender(lookupService.resolve("GENDER", req.genderCode()));
        }
        if (req.bloodTypeCode() != null && !req.bloodTypeCode().isBlank()) {
            p.setBloodType(lookupService.resolve("BLOOD_TYPE", req.bloodTypeCode()));
        }
        Patient saved = patientRepository.save(p);
        auditRead(AuditAction.ACCOUNT_CREATED, saved.getId().toString(), "patient created by administrator");
        return saved;
    }

    @Transactional
    public PatientResponse createResponse(CreatePatientRequest req) {
        return PatientResponse.from(create(req));
    }

    @Transactional
    public void restore(UUID id) {
        Patient p = patientRepository.findById(id)
                .filter(Patient::isArchived)
                .orElseThrow(() -> new NotFoundException("Archived patient not found"));
        p.restore();
        p.setEnabled(true);
        auditRead(AuditAction.PROFILE_UPDATED, id.toString(), "patient restored");
    }

    @Transactional
    public void deletePermanently(UUID id) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found"));
        for (Consultation consultation : consultationRepository.findByAppointmentPatientIdOrderByOpenedAtDesc(id)) {
            for (Document document : documentRepository.findByConsultationId(consultation.getId())) {
                document.setConsultation(null);
                documentRepository.save(document);
            }
            consultationRepository.delete(consultation);
        }
        for (Document document : documentRepository.findByPatientId(id)) {
            analysisJobRepository.deleteAll(
                    analysisJobRepository.findByDocumentId(document.getId()));
            documentRepository.delete(document);
        }
        appointmentRepository.deleteAll(appointmentRepository.findByPatientId(id));
        healthBackgroundRepository.findByPatientId(id).ifPresent(healthBackgroundRepository::delete);
        patientRepository.delete(p);
        auditRead(AuditAction.RECORD_ARCHIVED, id.toString(), "patient permanently deleted");
    }

    private Patient load(UUID id) {
        return patientRepository.findById(id)
                .filter(p -> !p.isArchived())
                .orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    private void auditRead(AuditAction action, String targetId, String details) {
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), action, "Patient", targetId, details);
    }
}
