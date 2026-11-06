package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.AuthDtos.CreateStaffRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.StaffResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UpdateStaffRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.model.entity.Appointment;
import com.healthcare.medicalplatform.model.entity.Document;
import com.healthcare.medicalplatform.model.entity.MedicalAssistant;
import com.healthcare.medicalplatform.model.entity.Practitioner;
import com.healthcare.medicalplatform.model.entity.SystemAdministrator;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.model.enums.Role;
import com.healthcare.medicalplatform.repository.AppointmentRepository;
import com.healthcare.medicalplatform.repository.ConsultationRepository;
import com.healthcare.medicalplatform.repository.DocumentRepository;
import com.healthcare.medicalplatform.repository.PractitionerRepository;
import com.healthcare.medicalplatform.repository.TimeOffRepository;
import com.healthcare.medicalplatform.repository.UserRepository;
import com.healthcare.medicalplatform.repository.WorkingHoursRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/** M1 administrator operations: staff account creation, enable/disable. */
@Service
public class UserAdminService {

    private final UserRepository userRepository;
    private final PractitionerRepository practitionerRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final DocumentRepository documentRepository;
    private final LookupService lookupService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public UserAdminService(UserRepository userRepository,
                            PractitionerRepository practitionerRepository,
                            WorkingHoursRepository workingHoursRepository,
                            TimeOffRepository timeOffRepository,
                            AppointmentRepository appointmentRepository,
                            ConsultationRepository consultationRepository,
                            DocumentRepository documentRepository,
                            LookupService lookupService,
                            PasswordEncoder passwordEncoder,
                            AuditService auditService,
                            CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.practitionerRepository = practitionerRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.timeOffRepository = timeOffRepository;
        this.appointmentRepository = appointmentRepository;
        this.consultationRepository = consultationRepository;
        this.documentRepository = documentRepository;
        this.lookupService = lookupService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    @Transactional
    public UserSummary createStaff(CreateStaffRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already registered");
        }
        String hash = passwordEncoder.encode(req.temporaryPassword());
        String first = req.firstName().trim();
        String last = req.lastName().trim();

        User created = switch (req.role()) {
            case PATIENT -> throw new BadRequestException(
                    "Patients register themselves via /api/auth/register");
            case PRACTITIONER -> {
                if (req.licenseNumber() == null || req.licenseNumber().isBlank()) {
                    throw new BadRequestException("licenseNumber is required for practitioners");
                }
                if (practitionerRepository.existsByLicenseNumber(req.licenseNumber())) {
                    throw new ConflictException("License number already registered");
                }
                Practitioner p = new Practitioner(email, hash, first, last, req.licenseNumber(),
                        lookupService.resolve("SPECIALTY", req.specialtyCode()));
                p.setPhone(req.phone());
                yield p;
            }
            case MEDICAL_ASSISTANT -> {
                MedicalAssistant a = new MedicalAssistant(email, hash, first, last);
                a.setPhone(req.phone());
                yield a;
            }
            case ADMIN -> new SystemAdministrator(email, hash, first, last);
        };

        created = userRepository.save(created);
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.ACCOUNT_CREATED, "User",
                created.getId().toString(), "staff account, role " + req.role());
        return UserSummary.from(created);
    }

    @Transactional
    public StaffResponse updateStaff(UUID userId, UpdateStaffRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String newEmail = req.email().trim().toLowerCase();
        if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new ConflictException("Email already in use by another account");
        }
        user.setEmail(newEmail);

        String first = req.firstName().trim();
        String last = req.lastName().trim();

        if (user instanceof Practitioner p) {
            p.setFirstName(first);
            p.setLastName(last);
            p.setPhone(req.phone());
            if (req.licenseNumber() != null && !req.licenseNumber().isBlank()) {
                String newLic = req.licenseNumber().trim();
                if (!newLic.equalsIgnoreCase(p.getLicenseNumber()) && practitionerRepository.existsByLicenseNumber(newLic)) {
                    throw new ConflictException("License number already registered");
                }
                p.setLicenseNumber(newLic);
            }
            if (req.specialtyCode() != null && !req.specialtyCode().isBlank()) {
                p.setSpecialty(lookupService.resolve("SPECIALTY", req.specialtyCode()));
            }
        } else if (user instanceof MedicalAssistant a) {
            a.setFirstName(first);
            a.setLastName(last);
            a.setPhone(req.phone());
        } else if (user instanceof SystemAdministrator s) {
            s.setFirstName(first);
            s.setLastName(last);
        }

        user = userRepository.save(user);
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.PROFILE_UPDATED, "User",
                userId.toString(), "staff details updated");
        return StaffResponse.from(user);
    }

    @Transactional
    public void setEnabled(UUID userId, boolean enabled) {
        User actor = currentUser.require();
        if (actor.getId().equals(userId) && !enabled) {
            throw new BadRequestException("You cannot disable your own account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setEnabled(enabled);
        user.revokeTokens();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.PROFILE_UPDATED, "User",
                userId.toString(), enabled ? "enabled" : "disabled");
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> listStaff(boolean showArchived) {
        return userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(UserAdminService::isStaff))
                .filter(u -> u.isArchived() == showArchived)
                .map(StaffResponse::from)
                .sorted(Comparator.comparing(StaffResponse::lastName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(StaffResponse::firstName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Transactional
    public void archive(UUID userId) {
        User actor = currentUser.require();
        if (actor.getId().equals(userId)) {
            throw new BadRequestException("You cannot archive your own account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.archive();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.RECORD_ARCHIVED, "User",
                userId.toString(), "archived (moved to trash)");
    }

    @Transactional
    public void restore(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.restore();
        User actor = currentUser.require();
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.PROFILE_UPDATED, "User",
                userId.toString(), "restored from trash");
    }

    @Transactional
    public void deletePermanently(UUID userId) {
        User actor = currentUser.require();
        if (actor.getId().equals(userId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user instanceof Practitioner p) {
            // 1. Delete WorkingHours
            workingHoursRepository.deleteAll(workingHoursRepository.findByPractitionerIdOrderByDayOfWeek(userId));

            // 2. Delete TimeOff
            timeOffRepository.deleteByPractitionerId(userId);

            // 3. Delete Appointments & linked Consultations (detach documents)
            List<Appointment> appointments = appointmentRepository.findByPractitionerId(userId);
            for (Appointment a : appointments) {
                consultationRepository.findByAppointmentId(a.getId()).ifPresent(c -> {
                    List<Document> docs = documentRepository.findByConsultationId(c.getId());
                    for (Document doc : docs) {
                        doc.setConsultation(null);
                        documentRepository.save(doc);
                    }
                    consultationRepository.delete(c);
                });
                appointmentRepository.delete(a);
            }

            practitionerRepository.delete(p);
        }

        userRepository.delete(user);
        auditService.record(actor.getId(), actor.getEmail(), AuditAction.RECORD_ARCHIVED, "User",
                userId.toString(), "permanently deleted with cascade");
    }

    public static boolean isStaff(Role role) {
        return role != Role.PATIENT;
    }
}
