package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.AuthDtos.CreateStaffRequest;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.model.dto.LookupDtos.CreateLookupRequest;
import com.healthcare.medicalplatform.model.dto.LookupDtos.LookupResponse;
import com.healthcare.medicalplatform.model.dto.LookupDtos.UpdateLookupRequest;
import com.healthcare.medicalplatform.services.LookupService;
import com.healthcare.medicalplatform.services.PatientService;
import com.healthcare.medicalplatform.services.UserAdminService;
import com.healthcare.medicalplatform.model.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserAdminService userAdminService;

    @MockitoBean
    private LookupService lookupService;

    @MockitoBean
    private PatientService patientService;

    @Test
    void createStaffReturnsCreated() throws Exception {
        CreateStaffRequest request = new CreateStaffRequest("staff@test.local", "temp-password-123",
                Role.ADMIN, "First", "Last", "+1", null, null);
        UserSummary response = new UserSummary(UUID.randomUUID(), request.email(), Set.of(Role.ADMIN));
        when(userAdminService.createStaff(any())).thenReturn(response);

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(request.email()));
    }

    @Test
    void setEnabledReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(userAdminService).setEnabled(id, false);

        mockMvc.perform(patch("/api/admin/users/{id}/enabled/{enabled}", id, false))
                .andExpect(status().isNoContent());
    }

    @Test
    void listAllLookupsReturnsOk() throws Exception {
        when(lookupService.listAll("GENDER")).thenReturn(List.of(
                new LookupResponse(1L, "GENDER", "MALE", "Male", true)));

        mockMvc.perform(get("/api/admin/lookups/GENDER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("MALE"));
    }

    @Test
    void createLookupReturnsCreated() throws Exception {
        CreateLookupRequest request = new CreateLookupRequest("GENDER", "OTHER", "Other");
        LookupResponse response = new LookupResponse(2L, "GENDER", "OTHER", "Other", true);
        when(lookupService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/admin/lookups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("OTHER"));
    }

    @Test
    void updateLookupReturnsOk() throws Exception {
        UpdateLookupRequest request = new UpdateLookupRequest("Updated", true);
        LookupResponse response = new LookupResponse(1L, "GENDER", "MALE", "Updated", true);
        when(lookupService.update(1L, request)).thenReturn(response);

        mockMvc.perform(put("/api/admin/lookups/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Updated"));
    }

    @Test
    void archivePatientReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(patientService).archive(id);

        mockMvc.perform(post("/api/admin/patients/{id}/archive", id))
                .andExpect(status().isNoContent());
    }
}

