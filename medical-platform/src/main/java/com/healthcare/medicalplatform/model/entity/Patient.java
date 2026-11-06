package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.Set;

/** M2 patient profile. All demographic and health-identity fields live here, not in User. */
@Entity
@Table(name = "patients")
@PrimaryKeyJoinColumn(name = "user_id")
public class Patient extends User {

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(length = 32)
    private String phone;

    @Column(name = "national_id", unique = true, length = 64)
    private String nationalId;

    @Column(length = 255)
    private String address;

    @Column(name = "emergency_contact_name", length = 160)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 32)
    private String emergencyContactPhone;

    @Column(name = "insurance_provider", length = 120)
    private String insuranceProvider;

    @Column(name = "insurance_number", length = 64)
    private String insuranceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gender_id")
    private LookupValue gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_type_id")
    private LookupValue bloodType;

    protected Patient() {
    }

    public Patient(String email, String passwordHash, String firstName, String lastName,
                   LocalDate dateOfBirth) {
        super(email, passwordHash, Set.of(Role.PATIENT));
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
    }

    public void archive() {
        this.setArchived(true);
        setEnabled(false);
        revokeTokens();
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String v) { this.emergencyContactName = v; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String v) { this.emergencyContactPhone = v; }
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String v) { this.insuranceProvider = v; }
    public String getInsuranceNumber() { return insuranceNumber; }
    public void setInsuranceNumber(String v) { this.insuranceNumber = v; }
    public LookupValue getGender() { return gender; }
    public void setGender(LookupValue gender) { this.gender = gender; }
    public LookupValue getBloodType() { return bloodType; }
    public void setBloodType(LookupValue bloodType) { this.bloodType = bloodType; }
}
