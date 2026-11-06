package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.DocumentDtos.AnalysisResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.FindingResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.ReviewRequest;
import com.healthcare.medicalplatform.model.enums.AnalysisStatus;
import com.healthcare.medicalplatform.model.enums.FindingDecision;
import com.healthcare.medicalplatform.services.AnalysisService;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalysisController.class)
@AutoConfigureMockMvc(addFilters = false)
class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AnalysisService service;

    @Test
    void requestAnalysisReturnsAccepted() throws Exception {
        UUID documentId = UUID.randomUUID();
        AnalysisResponse response = new AnalysisResponse(UUID.randomUUID(), documentId,
                AnalysisStatus.QUEUED, Instant.now(), null, null, List.of());
        when(service.requestAnalysis(documentId)).thenReturn(response);

        mockMvc.perform(post("/api/documents/{documentId}/analysis", documentId))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("QUEUED"));
    }

    @Test
    void resultsReturnsOk() throws Exception {
        UUID documentId = UUID.randomUUID();
        when(service.forDocument(documentId)).thenReturn(List.of());

        mockMvc.perform(get("/api/documents/{documentId}/analysis", documentId))
                .andExpect(status().isOk());
    }

    @Test
    void reviewReturnsOk() throws Exception {
        ReviewRequest request = new ReviewRequest(FindingDecision.VALIDATED);
        FindingResponse response = new FindingResponse(1L, "label", 0.9, "note", FindingDecision.VALIDATED);
        when(service.review(anyLong(), any())).thenReturn(response);

        mockMvc.perform(put("/api/analysis/findings/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("VALIDATED"));
    }
}

