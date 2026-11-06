package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.AuthDtos.CreateStaffRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.StaffResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UpdateStaffRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.model.dto.LookupDtos.CreateLookupRequest;
import com.healthcare.medicalplatform.model.dto.LookupDtos.LookupResponse;
import com.healthcare.medicalplatform.model.dto.LookupDtos.UpdateLookupRequest;
import com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse;
import com.healthcare.medicalplatform.services.LookupService;
import com.healthcare.medicalplatform.services.PatientService;
import com.healthcare.medicalplatform.services.UserAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Everything under /api/admin requires ROLE_ADMIN (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserAdminService userAdminService;
    private final LookupService lookupService;
    private final PatientService patientService;

    public AdminController(UserAdminService userAdminService, LookupService lookupService,
                           PatientService patientService) {
        this.userAdminService = userAdminService;
        this.lookupService = lookupService;
        this.patientService = patientService;
    }

    // ---- M1: accounts ----

    @GetMapping("/users")
    public List<StaffResponse> listStaff(@RequestParam(required = false, defaultValue = "false") boolean archived) {
        return userAdminService.listStaff(archived);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return userAdminService.createStaff(request);
    }

    @PutMapping("/users/{id}")
    public StaffResponse updateStaff(@PathVariable UUID id, @Valid @RequestBody UpdateStaffRequest request) {
        return userAdminService.updateStaff(id, request);
    }

    @PatchMapping("/users/{id}/enabled/{enabled}")
    public ResponseEntity<Void> setEnabled(@PathVariable UUID id, @PathVariable boolean enabled) {
        userAdminService.setEnabled(id, enabled);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/archive")
    public ResponseEntity<Void> archiveUser(@PathVariable UUID id) {
        userAdminService.archive(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/restore")
    public ResponseEntity<Void> restoreUser(@PathVariable UUID id) {
        userAdminService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}/permanent")
    public ResponseEntity<Void> deleteUserPermanently(@PathVariable UUID id) {
        userAdminService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }

    // ---- S1: reference data ----

    @GetMapping("/lookups/{category}")
    public List<LookupResponse> listAllLookups(@PathVariable String category) {
        return lookupService.listAll(category);
    }

    @PostMapping("/lookups")
    @ResponseStatus(HttpStatus.CREATED)
    public LookupResponse createLookup(@Valid @RequestBody CreateLookupRequest request) {
        return lookupService.create(request);
    }

    @PutMapping("/lookups/{id}")
    public LookupResponse updateLookup(@PathVariable Long id,
                                       @Valid @RequestBody UpdateLookupRequest request) {
        return lookupService.update(id, request);
    }

    // ---- M2: 2.6 archive (administrator only, no clinical content exposed) ----

    @GetMapping("/patients")
    public List<PatientResponse> listPatients(
            @RequestParam(required = false, defaultValue = "false") boolean archived) {
        return patientService.listResponses(archived).stream()
                .map(patient -> new PatientResponse(
                        patient.id(),
                        patient.email(),
                        patient.firstName(),
                        patient.lastName(),
                        patient.dateOfBirth(),
                        patient.phone(),
                        patient.nationalId(),
                        patient.address(),
                        patient.emergencyContactName(),
                        patient.emergencyContactPhone(),
                        patient.insuranceProvider(),
                        patient.insuranceNumber(),
                        null,
                        null,
                        patient.archived()))
                .toList();
    }

    @PostMapping("/patients/{id}/archive")
    public ResponseEntity<Void> archivePatient(@PathVariable UUID id) {
        patientService.archive(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/patients/{id}/restore")
    public ResponseEntity<Void> restorePatient(@PathVariable UUID id) {
        patientService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/patients/{id}/permanent")
    public ResponseEntity<Void> deletePatientPermanently(@PathVariable UUID id) {
        patientService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}
