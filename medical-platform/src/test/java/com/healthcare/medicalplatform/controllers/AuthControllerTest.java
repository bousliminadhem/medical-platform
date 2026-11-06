package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.AuthDtos.AuthResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.ChangePasswordRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.LoginRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.RegisterPatientRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.services.AuthService;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.model.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CurrentUser currentUser;

    @Test
    void registerReturnsCreated() throws Exception {
        RegisterPatientRequest request = new RegisterPatientRequest(
                "patient@test.local", "strong-password-123", "First", "Last",
                java.time.LocalDate.now().minusYears(30), "+123", "NID-1");
        AuthResponse response = new AuthResponse("token", "Bearer", Instant.now(),
                new UserSummary(UUID.randomUUID(), request.email(), Set.of(Role.PATIENT)));
        when(authService.registerPatient(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void loginReturnsOk() throws Exception {
        LoginRequest request = new LoginRequest("patient@test.local", "password");
        AuthResponse response = new AuthResponse("token", "Bearer", Instant.now(),
                new UserSummary(UUID.randomUUID(), request.email(), Set.of(Role.PATIENT)));
        when(authService.login(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("token"));
    }

    @Test
    void logoutReturnsNoContent() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent());
    }

    @Test
    void changePasswordReturnsOk() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("old-password", "new-password-123");
        AuthResponse response = new AuthResponse("token", "Bearer", Instant.now(),
                new UserSummary(UUID.randomUUID(), "patient@test.local", Set.of(Role.PATIENT)));
        when(authService.changePassword(any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("token"));
    }

    @Test
    void meReturnsUserSummary() throws Exception {
        User user = org.mockito.Mockito.mock(User.class);
        UUID id = UUID.randomUUID();
        when(user.getId()).thenReturn(id);
        when(user.getEmail()).thenReturn("patient@test.local");
        when(user.getRoles()).thenReturn(Set.of(Role.PATIENT));
        when(currentUser.require()).thenReturn(user);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("patient@test.local"));
    }
}

