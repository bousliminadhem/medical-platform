package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.*;
import com.healthcare.medicalplatform.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    /** 1.1 patients can self-register. */
    public record RegisterPatientRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String password,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @NotNull @Past LocalDate dateOfBirth,
            @Size(max = 32) String phone,
            @Size(max = 64) String nationalId) {
    }

    /** 1.1 staff accounts are created by an administrator. */
    public record CreateStaffRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String temporaryPassword,
            @NotNull Role role,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @Size(max = 32) String phone,
            /** Required when role is PRACTITIONER. */
            @Size(max = 64) String licenseNumber,
            /** Lookup code in the SPECIALTY category; required when role is PRACTITIONER. */
            @Size(max = 64) String specialtyCode) {
    }

    public record UpdateStaffRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @Size(max = 32) String phone,
            @Size(max = 64) String licenseNumber,
            @Size(max = 64) String specialtyCode) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 10, max = 128) String newPassword) {
    }

    public record UpdateAccountRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @Size(max = 32) String phone) {
    }

    public record AuthResponse(
            String accessToken,
            String tokenType,
            Instant expiresAt,
            UserSummary user) {
    }

    public record UserSummary(UUID id, String email, String firstName, String lastName,
                              String phone, Set<Role> roles) {
        public static UserSummary from(User user) {
            String firstName = "";
            String lastName = "";
            String phone = null;
            if (user instanceof Patient patient) {
                firstName = patient.getFirstName();
                lastName = patient.getLastName();
                phone = patient.getPhone();
            } else if (user instanceof Practitioner practitioner) {
                firstName = practitioner.getFirstName();
                lastName = practitioner.getLastName();
                phone = practitioner.getPhone();
            } else if (user instanceof MedicalAssistant assistant) {
                firstName = assistant.getFirstName();
                lastName = assistant.getLastName();
                phone = assistant.getPhone();
            } else if (user instanceof SystemAdministrator administrator) {
                firstName = administrator.getFirstName();
                lastName = administrator.getLastName();
            }
            return new UserSummary(user.getId(), user.getEmail(), firstName, lastName,
                    phone, Set.copyOf(user.getRoles()));
        }
    }

    public record StaffResponse(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String phone,
            Role role,
            Set<Role> roles,
            boolean enabled,
            String licenseNumber,
            String specialty,
            String specialtyCode,
            Boolean active,
            boolean archived) {
        public static StaffResponse from(User user) {
            String firstName = "";
            String lastName = "";
            String phone = null;
            String licenseNumber = null;
            String specialty = null;
            String specialtyCode = null;
            Boolean active = user.isEnabled();
            Role primaryRole = user.getRoles().stream().findFirst().orElse(Role.ADMIN);

            if (user instanceof Practitioner p) {
                firstName = p.getFirstName();
                lastName = p.getLastName();
                phone = p.getPhone();
                licenseNumber = p.getLicenseNumber();
                specialty = p.getSpecialty() != null ? p.getSpecialty().getLabel() : null;
                specialtyCode = p.getSpecialty() != null ? p.getSpecialty().getCode() : null;
                active = p.isActive();
                primaryRole = Role.PRACTITIONER;
            } else if (user instanceof MedicalAssistant a) {
                firstName = a.getFirstName();
                lastName = a.getLastName();
                phone = a.getPhone();
                active = user.isEnabled();
                primaryRole = Role.MEDICAL_ASSISTANT;
            } else if (user instanceof SystemAdministrator s) {
                firstName = s.getFirstName();
                lastName = s.getLastName();
                active = user.isEnabled();
                primaryRole = Role.ADMIN;
            }
            return new StaffResponse(user.getId(), user.getEmail(), firstName, lastName, phone,
                    primaryRole, Set.copyOf(user.getRoles()), user.isEnabled(), licenseNumber, specialty, specialtyCode,
                    active, user.isArchived());
        }
    }
}
