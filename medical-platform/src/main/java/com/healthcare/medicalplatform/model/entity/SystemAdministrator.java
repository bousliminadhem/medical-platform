package com.healthcare.medicalplatform.model.entity;

import com.healthcare.medicalplatform.model.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.Set;

/** Technical/security manager: accounts, roles, reference data. No routine clinical access. */
@Entity
@Table(name = "system_administrators")
@PrimaryKeyJoinColumn(name = "user_id")
public class SystemAdministrator extends User {

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    protected SystemAdministrator() {
    }

    public SystemAdministrator(String email, String passwordHash, String firstName, String lastName) {
        super(email, passwordHash, Set.of(Role.ADMIN));
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
