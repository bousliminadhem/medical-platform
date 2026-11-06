package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.context.CurrentUser;
import com.healthcare.medicalplatform.model.dto.PatientDtos.UpdatePatientRequest;
import com.healthcare.medicalplatform.model.dto.PatientDtos.PatientResponse;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.healthcare.medicalplatform.services.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientController.class)
@AutoConfigureMockMvc(addFilters = false)
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PatientService patientService;

    @MockitoBean
    private CurrentUser currentUser;

    @Test
    void meReturnsOk() throws Exception {
        when(patientService.getOwnResponse()).thenReturn(response());

        mockMvc.perform(get("/api/patients/me"))
                .andExpect(status().isOk());
    }

    @Test
    void updateMeReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(currentUser.requireId()).thenReturn(id);
        when(patientService.updateResponse(any(UUID.class), any())).thenReturn(response());
        UpdatePatientRequest request = new UpdatePatientRequest("Updated", null, null, "+1", null,
                null, null, null, null, null, null);

        mockMvc.perform(put("/api/patients/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void searchReturnsOk() throws Exception {
        Page<Patient> page = new PageImpl<>(java.util.List.of(), PageRequest.of(0, 20), 0);
        when(patientService.search(any(), any())).thenReturn(page);
        when(currentUser.hasRole("PRACTITIONER")).thenReturn(true);

        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(patientService.getResponse(id)).thenReturn(response());
        when(currentUser.hasRole("PRACTITIONER")).thenReturn(true);

        mockMvc.perform(get("/api/patients/{id}", id))
                .andExpect(status().isOk());
    }

    @Test
    void updateReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(patientService.updateResponse(any(UUID.class), any())).thenReturn(response());
        when(currentUser.hasRole("PRACTITIONER")).thenReturn(true);
        UpdatePatientRequest request = new UpdatePatientRequest("Updated", null, null, null, null,
                null, null, null, null, null, null);

        mockMvc.perform(put("/api/patients/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private static PatientResponse response() {
        return new PatientResponse(UUID.randomUUID(), "patient@example.com", "First", "Last",
                java.time.LocalDate.of(1990, 1, 1), null, null, null, null, null,
                null, null, null, null, false);
    }
}
