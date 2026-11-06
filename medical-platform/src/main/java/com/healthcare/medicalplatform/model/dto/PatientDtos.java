package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.Patient;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public final class PatientDtos {

    private PatientDtos() {
    }

    public record CreatePatientRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String temporaryPassword,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @NotNull @Past LocalDate dateOfBirth,
            @Size(max = 32) String phone,
            @Size(max = 64) String nationalId,
            @Size(max = 255) String address,
            @Size(max = 160) String emergencyContactName,
            @Size(max = 32) String emergencyContactPhone,
            @Size(max = 120) String insuranceProvider,
            @Size(max = 64) String insuranceNumber,
            @Size(max = 64) String genderCode,
            @Size(max = 64) String bloodTypeCode) {
    }

    /** Partial-update semantics: null fields are left unchanged. */
    public record UpdatePatientRequest(
            @Email @Size(max = 254) String email,
            @Size(min = 1, max = 80) String firstName,
            @Size(min = 1, max = 80) String lastName,
            @Past LocalDate dateOfBirth,
            @Size(max = 32) String phone,
            @Size(max = 255) String address,
            @Size(max = 160) String emergencyContactName,
            @Size(max = 32) String emergencyContactPhone,
            @Size(max = 120) String insuranceProvider,
            @Size(max = 64) String insuranceNumber,
            /** Lookup code in the GENDER category. */
            @Size(max = 64) String genderCode,
            /** Lookup code in the BLOOD_TYPE category. */
            @Size(max = 64) String bloodTypeCode) {

        public UpdatePatientRequest(String firstName, String lastName, LocalDate dateOfBirth,
                                    String phone, String address, String emergencyContactName,
                                    String emergencyContactPhone, String insuranceProvider,
                                    String insuranceNumber, String genderCode, String bloodTypeCode) {
            this(null, firstName, lastName, dateOfBirth, phone, address, emergencyContactName,
                    emergencyContactPhone, insuranceProvider, insuranceNumber, genderCode, bloodTypeCode);
        }
    }

    public record PatientResponse(
            UUID id,
            String email,
            String firstName,
            String lastName,
            LocalDate dateOfBirth,
            String phone,
            String nationalId,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            String insuranceProvider,
            String insuranceNumber,
            String gender,
            String bloodType,
            boolean archived) {

        public static PatientResponse from(Patient p) {
            return new PatientResponse(
                    p.getId(), p.getEmail(), p.getFirstName(), p.getLastName(), p.getDateOfBirth(),
                    p.getPhone(), p.getNationalId(), p.getAddress(),
                    p.getEmergencyContactName(), p.getEmergencyContactPhone(),
                    p.getInsuranceProvider(), p.getInsuranceNumber(),
                    p.getGender() == null ? null : p.getGender().getCode(),
                    p.getBloodType() == null ? null : p.getBloodType().getCode(),
                    p.isArchived());
        }
    }

    /** Reduced view for medical assistants: demographics and contact only, no health fields. */
    public record PatientContactResponse(
            UUID id,
            String firstName,
            String lastName,
            LocalDate dateOfBirth,
            String phone,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            String insuranceProvider,
            String insuranceNumber) {

        public static PatientContactResponse from(Patient p) {
            return new PatientContactResponse(
                    p.getId(), p.getFirstName(), p.getLastName(), p.getDateOfBirth(),
                    p.getPhone(), p.getAddress(),
                    p.getEmergencyContactName(), p.getEmergencyContactPhone(),
                    p.getInsuranceProvider(), p.getInsuranceNumber());
        }
    }
}
