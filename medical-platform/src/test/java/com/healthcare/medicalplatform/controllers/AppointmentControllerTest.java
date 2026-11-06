package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.ScheduleDtos.AppointmentResponse;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.BookAppointment;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.CancelRequest;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.RequestAppointment;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.RescheduleRequest;
import com.healthcare.medicalplatform.model.dto.ScheduleDtos.StatusRequest;
import com.healthcare.medicalplatform.model.enums.AppointmentStatus;
import com.healthcare.medicalplatform.services.SchedulingService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppointmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SchedulingService service;

    private AppointmentResponse sample() {
        return new AppointmentResponse(UUID.randomUUID(), UUID.randomUUID(), "Patient", UUID.randomUUID(),
                "Practitioner", Instant.now(), Instant.now().plusSeconds(1800), AppointmentStatus.SCHEDULED,
                "reason", null);
    }

    @Test
    void requestReturnsCreated() throws Exception {
        RequestAppointment request = new RequestAppointment(UUID.randomUUID(), Instant.now(), "reason");
        when(service.request(any())).thenReturn(sample());

        mockMvc.perform(post("/api/appointments/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void bookReturnsCreated() throws Exception {
        BookAppointment request = new BookAppointment(UUID.randomUUID(), UUID.randomUUID(), Instant.now(), "reason");
        when(service.book(any())).thenReturn(sample());

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void agendaReturnsOk() throws Exception {
        when(service.agenda(any(LocalDate.class), any(LocalDate.class), any())).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/appointments")
                        .param("from", "2026-11-02")
                        .param("to", "2026-11-02"))
                .andExpect(status().isOk());
    }

    @Test
    void confirmReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.confirm(id)).thenReturn(sample());

        mockMvc.perform(post("/api/appointments/{id}/confirm", id))
                .andExpect(status().isOk());
    }

    @Test
    void rescheduleReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        RescheduleRequest request = new RescheduleRequest(Instant.now().plusSeconds(3600));
        when(service.reschedule(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(post("/api/appointments/{id}/reschedule", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void cancelReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        CancelRequest request = new CancelRequest("reason");
        when(service.cancel(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(post("/api/appointments/{id}/cancel", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void statusReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        StatusRequest request = new StatusRequest(AppointmentStatus.CONFIRMED);
        when(service.updateStatus(any(UUID.class), any())).thenReturn(sample());

        mockMvc.perform(patch("/api/appointments/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}

