package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundRequest;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.HealthBackgroundResponse;
import com.healthcare.medicalplatform.model.dto.ClinicalDtos.TimelineEntry;
import com.healthcare.medicalplatform.services.HealthBackgroundService;
import com.healthcare.medicalplatform.services.TimelineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientHistoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class PatientHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private HealthBackgroundService backgroundService;

    @MockitoBean
    private TimelineService timelineService;

    @Test
    void backgroundReturnsOk() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(backgroundService.get(patientId)).thenReturn(new HealthBackgroundResponse("c", "a", "m", Instant.now()));

        mockMvc.perform(get("/api/patients/{patientId}/background", patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chronicConditions").value("c"));
    }

    @Test
    void updateBackgroundReturnsOk() throws Exception {
        UUID patientId = UUID.randomUUID();
        HealthBackgroundRequest request = new HealthBackgroundRequest("c", "a", "m");
        when(backgroundService.update(any(UUID.class), any())).thenReturn(new HealthBackgroundResponse("c", "a", "m", Instant.now()));

        mockMvc.perform(put("/api/patients/{patientId}/background", patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void timelineReturnsOk() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(timelineService.timeline(patientId)).thenReturn(List.of(
                new TimelineEntry(Instant.now(), "APPOINTMENT", "SCHEDULED", UUID.randomUUID().toString())));

        mockMvc.perform(get("/api/patients/{patientId}/timeline", patientId))
                .andExpect(status().isOk());
    }
}

