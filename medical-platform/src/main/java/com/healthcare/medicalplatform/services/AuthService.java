package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.common.BadRequestException;
import com.healthcare.medicalplatform.common.ConflictException;
import com.healthcare.medicalplatform.config.AppSecurityProperties;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.AuthDtos.AuthResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.ChangePasswordRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.LoginRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.RegisterPatientRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UpdateAccountRequest;
import com.healthcare.medicalplatform.model.entity.MedicalAssistant;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.healthcare.medicalplatform.model.entity.Practitioner;
import com.healthcare.medicalplatform.model.entity.SystemAdministrator;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.AuditAction;
import com.healthcare.medicalplatform.repository.PatientRepository;
import com.healthcare.medicalplatform.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    /** Used to burn the same CPU time when the e-mail is unknown (mitigates user enumeration by timing). */
    private final String dummyHash;

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final CurrentUser currentUser;
    private final AppSecurityProperties props;

    public AuthService(UserRepository userRepository, PatientRepository patientRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       AuditService auditService, CurrentUser currentUser,
                       AppSecurityProperties props) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.currentUser = currentUser;
        this.props = props;
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    /** 1.1 patient self-registration. */
    @Transactional
    public AuthResponse registerPatient(RegisterPatientRequest req) {
        String email = normalize(req.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already registered");
        }
        if (req.nationalId() != null && patientRepository.existsByNationalId(req.nationalId())) {
            throw new ConflictException("National ID already registered");
        }
        Patient patient = new Patient(email, passwordEncoder.encode(req.password()),
                req.firstName().trim(), req.lastName().trim(), req.dateOfBirth());
        patient.setPhone(req.phone());
        patient.setNationalId(req.nationalId());
        patient = patientRepository.save(patient);

        auditService.record(patient.getId(), patient.getEmail(), AuditAction.ACCOUNT_CREATED,
                "Patient", patient.getId().toString(), "self-registration");
        return jwtService.issue(patient);
    }

    /**
     * 1.2 login. Failed attempts and the audit entry must survive the thrown exception,
     * hence noRollbackFor.
     */
    @Transactional(noRollbackFor = {BadCredentialsException.class, LockedException.class,
            DisabledException.class})
    public AuthResponse login(LoginRequest req) {
        String email = normalize(req.email());
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            passwordEncoder.matches(req.password(), dummyHash);
            auditService.record(null, email, AuditAction.LOGIN_FAILURE, "User", null, "unknown email");
            throw new BadCredentialsException("Bad credentials");
        }

        Instant now = Instant.now();
        if (user.isLocked(now)) {
            auditService.record(user.getId(), email, AuditAction.LOGIN_FAILURE, "User",
                    user.getId().toString(), "account locked");
            throw new LockedException("Account locked");
        }
        if (!user.isEnabled()) {
            auditService.record(user.getId(), email, AuditAction.LOGIN_FAILURE, "User",
                    user.getId().toString(), "account disabled");
            throw new DisabledException("Account disabled");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            boolean wasLocked = user.isLocked(now);
            user.registerFailedLogin(props.maxFailedAttempts(), now.plus(props.lockDuration()));
            auditService.record(user.getId(), email, AuditAction.LOGIN_FAILURE, "User",
                    user.getId().toString(), "bad password");
            if (!wasLocked && user.isLocked(now)) {
                auditService.record(user.getId(), email, AuditAction.ACCOUNT_LOCKED, "User",
                        user.getId().toString(), "too many failed attempts");
            }
            throw new BadCredentialsException("Bad credentials");
        }

        user.registerSuccessfulLogin(now);
        auditService.record(user.getId(), email, AuditAction.LOGIN_SUCCESS, "User",
                user.getId().toString(), null);
        return jwtService.issue(user);
    }

    /** Stateless logout: bumping the token version invalidates every token issued so far. */
    @Transactional
    public void logout() {
        User user = currentUser.require();
        user.revokeTokens();
        auditService.record(user.getId(), user.getEmail(), AuditAction.LOGOUT, "User",
                user.getId().toString(), null);
    }

    /** 1.6 own account management. Returns a fresh token because the old ones are revoked. */
    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest req) {
        User user = currentUser.require();
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must differ from the current one");
        }
        user.changePassword(passwordEncoder.encode(req.newPassword()));
        auditService.record(user.getId(), user.getEmail(), AuditAction.PASSWORD_CHANGED, "User",
                user.getId().toString(), null);
        return jwtService.issue(user);
    }

    @Transactional
    public User updateAccount(UpdateAccountRequest req) {
        User user = currentUser.require();
        String email = normalize(req.email());
        if (!email.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already registered");
        }
        user.setEmail(email);
        if (user instanceof Patient patient) {
            patient.setFirstName(req.firstName().trim());
            patient.setLastName(req.lastName().trim());
            patient.setPhone(req.phone());
        } else if (user instanceof Practitioner practitioner) {
            practitioner.setFirstName(req.firstName().trim());
            practitioner.setLastName(req.lastName().trim());
            practitioner.setPhone(req.phone());
        } else if (user instanceof MedicalAssistant assistant) {
            assistant.setFirstName(req.firstName().trim());
            assistant.setLastName(req.lastName().trim());
            assistant.setPhone(req.phone());
        } else if (user instanceof SystemAdministrator administrator) {
            administrator.setFirstName(req.firstName().trim());
            administrator.setLastName(req.lastName().trim());
        }
        auditService.record(user.getId(), user.getEmail(), AuditAction.PROFILE_UPDATED,
                "User", user.getId().toString(), "own account settings");
        return user;
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase();
    }
}
