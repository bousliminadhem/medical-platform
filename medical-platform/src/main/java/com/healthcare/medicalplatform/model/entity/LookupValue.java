package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** S1 Reference Data: gender, blood type, specialty, appointment status, document type... */
@Entity
@Table(name = "lookup_values",
        uniqueConstraints = @UniqueConstraint(columnNames = {"category", "code"}))
public class LookupValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(nullable = false, length = 128)
    private String label;

    @Column(nullable = false)
    private boolean active = true;

    protected LookupValue() {
    }

    public LookupValue(String category, String code, String label) {
        this.category = category;
        this.code = code;
        this.label = label;
    }

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public String getCode() { return code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
