package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.Set;

/** Doctor / clinician profile (3.1). */
@Entity
@Table(name = "practitioners")
@PrimaryKeyJoinColumn(name = "user_id")
public class Practitioner extends User {

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(length = 32)
    private String phone;

    @Column(name = "license_number", nullable = false, unique = true, length = 64)
    private String licenseNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialty_id")
    private LookupValue specialty;

    @Column(nullable = false)
    private boolean active = true;

    protected Practitioner() {
    }

    public Practitioner(String email, String passwordHash, String firstName, String lastName,
                        String licenseNumber, LookupValue specialty) {
        super(email, passwordHash, Set.of(Role.PRACTITIONER));
        this.firstName = firstName;
        this.lastName = lastName;
        this.licenseNumber = licenseNumber;
        this.specialty = specialty;
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public LookupValue getSpecialty() { return specialty; }
    public void setSpecialty(LookupValue specialty) { this.specialty = specialty; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
