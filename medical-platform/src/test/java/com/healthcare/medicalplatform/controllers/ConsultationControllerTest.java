package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ClinicalDtos.ConsultationResponse;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.FollowUpRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.IssuePrescriptionRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.NotesRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.PrescriptionItemRequest;
import com.healthcare.medicalplatform.model.enums.ConsultationStatus;
import com.healthcare.medicalplatform.services.ConsultationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConsultationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ConsultationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ConsultationService service;

    private ConsultationResponse sample() {
        return new ConsultationResponse(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                ConsultationStatus.OPEN, "complaint", "findings", "diagnosis", List.of(),
                LocalDate.now(), "checks", "instructions", Instant.now(), null);
    }

    @Test
    void openReturnsCreated() throws Exception {
        UUID appointmentId = UUID.randomUUID();
        when(service.open(appointmentId)).thenReturn(sample());

        mockMvc.perform(post("/api/appointments/{appointmentId}/consultation", appointmentId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void notesReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        NotesRequest request = new NotesRequest("complaint", "findings", "diagnosis");
        when(service.recordNotes(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(put("/api/consultations/{id}/notes", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void prescribeReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        IssuePrescriptionRequest request = new IssuePrescriptionRequest(List.of(
                new PrescriptionItemRequest("Med", "10mg", "daily", 7)));
        when(service.issuePrescription(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(post("/api/consultations/{id}/prescription", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void followUpReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        FollowUpRequest request = new FollowUpRequest(LocalDate.now().plusDays(7), "checks", "instructions");
        when(service.defineFollowUp(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(put("/api/consultations/{id}/follow-up", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void closeReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.close(id)).thenReturn(sample());

        mockMvc.perform(post("/api/consultations/{id}/close", id))
                .andExpect(status().isOk());
    }

    @Test
    void viewReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.view(id)).thenReturn(sample());

        mockMvc.perform(get("/api/consultations/{id}", id))
                .andExpect(status().isOk());
    }

    @Test
    void forPatientReturnsOk() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(service.listForPatient(patientId)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/patients/{patientId}/consultations", patientId))
                .andExpect(status().isOk());
    }
}

