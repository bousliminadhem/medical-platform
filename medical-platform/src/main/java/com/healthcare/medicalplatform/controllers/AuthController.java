package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.AuthDtos.AuthResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.ChangePasswordRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.LoginRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.RegisterPatientRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UpdateAccountRequest;
import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;

    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterPatientRequest request) {
        return authService.registerPatient(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password")
    public AuthResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request);
    }

    @GetMapping("/me")
    public UserSummary me() {
        return UserSummary.from(currentUser.require());
    }

    @org.springframework.web.bind.annotation.PutMapping("/me")
    public UserSummary updateAccount(@Valid @RequestBody UpdateAccountRequest request) {
        return UserSummary.from(authService.updateAccount(request));
    }
}
