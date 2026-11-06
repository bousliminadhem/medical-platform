package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ScheduleDtos.PractitionerResponse;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.SlotResponse;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.TimeOffRequest;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.WorkingHoursRequest;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.WorkingHoursResponse;
import com.healthcare.medicalplatform.services.PractitionerService;
import com.healthcare.medicalplatform.services.SchedulingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ScheduleController.class)
@AutoConfigureMockMvc(addFilters = false)
class ScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PractitionerService practitionerService;

    @MockitoBean
    private SchedulingService schedulingService;

    @Test
    void listReturnsOk() throws Exception {
        when(practitionerService.listActive()).thenReturn(List.of());

        mockMvc.perform(get("/api/practitioners"))
                .andExpect(status().isOk());
    }

    @Test
    void slotsReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(schedulingService.availableSlots(any(UUID.class), any())).thenReturn(List.of(
                new SlotResponse(Instant.now(), Instant.now().plusSeconds(1800))));

        mockMvc.perform(get("/api/practitioners/{id}/slots", id).param("date", "2026-11-02"))
                .andExpect(status().isOk());
    }

    @Test
    void workingHoursReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(schedulingService.getWorkingHours(id)).thenReturn(List.of());

        mockMvc.perform(get("/api/practitioners/{id}/working-hours", id))
                .andExpect(status().isOk());
    }

    @Test
    void setWorkingHoursReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        WorkingHoursRequest request = new WorkingHoursRequest(DayOfWeek.MONDAY, LocalTime.of(9, 0),
                LocalTime.of(17, 0), null, null, 30);
        WorkingHoursResponse response = new WorkingHoursResponse(DayOfWeek.MONDAY, LocalTime.of(9, 0),
                LocalTime.of(17, 0), null, null, 30);
        when(schedulingService.setWorkingHours(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(put("/api/practitioners/{id}/working-hours", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slotMinutes").value(30));
    }

    @Test
    void timeOffReturnsCreated() throws Exception {
        UUID id = UUID.randomUUID();
        TimeOffRequest request = new TimeOffRequest(Instant.now(), Instant.now().plusSeconds(3600), "reason");

        mockMvc.perform(post("/api/practitioners/{id}/time-off", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void setActiveReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        PractitionerResponse response = new PractitionerResponse(id, "First", "Last", "Spec", "LIC", true);
        when(practitionerService.setActive(id, true)).thenReturn(response);

        mockMvc.perform(patch("/api/practitioners/{id}/active/{active}", id, true))
                .andExpect(status().isOk());
    }
}

