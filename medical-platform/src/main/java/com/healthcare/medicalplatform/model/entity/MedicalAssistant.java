package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.Set;

/** Reception / administrative staff. No clinical access (see report section 4). */
@Entity
@Table(name = "medical_assistants")
@PrimaryKeyJoinColumn(name = "user_id")
public class MedicalAssistant extends User {

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(length = 32)
    private String phone;

    protected MedicalAssistant() {
    }

    public MedicalAssistant(String email, String passwordHash, String firstName, String lastName) {
        super(email, passwordHash, Set.of(Role.MEDICAL_ASSISTANT));
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
