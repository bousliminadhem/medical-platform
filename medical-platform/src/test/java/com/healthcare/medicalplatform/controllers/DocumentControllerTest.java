package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.DocumentDtos.ClassifyRequest;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.DocumentResponse;
import com.healthcare.medicalplatform.model.dto.DocumentDtos.LinkRequest;
import com.healthcare.medicalplatform.services.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
@AutoConfigureMockMvc(addFilters = false)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DocumentService service;

    private DocumentResponse sample() {
        return new DocumentResponse(UUID.randomUUID(), UUID.randomUUID(), null, "LAB", "file.pdf",
                "application/pdf", 10L, Instant.now());
    }

    @Test
    void uploadReturnsCreated() throws Exception {
        UUID patientId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("file", "file.pdf", "application/pdf", "%PDF".getBytes());
        when(service.upload(eq(patientId), any(), eq("LAB"), org.mockito.ArgumentMatchers.isNull()))
                .thenReturn(sample());

        mockMvc.perform(multipart("/api/patients/{patientId}/documents", patientId)
                        .file(file)
                        .param("type", "LAB"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("file.pdf"));
    }

    @Test
    void listReturnsOk() throws Exception {
        UUID patientId = UUID.randomUUID();
        when(service.list(patientId)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/patients/{patientId}/documents", patientId))
                .andExpect(status().isOk());
    }

    @Test
    void downloadReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        org.springframework.core.io.Resource resource = new org.springframework.core.io.ByteArrayResource("data".getBytes());
        when(service.download(id)).thenReturn(new DocumentService.DownloadedFile(resource, "file.pdf", "application/pdf"));

        mockMvc.perform(get("/api/documents/{id}/download", id))
                .andExpect(status().isOk());
    }

    @Test
    void classifyReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        ClassifyRequest request = new ClassifyRequest("LAB");
        when(service.classify(id, request.typeCode())).thenReturn(sample());

        mockMvc.perform(put("/api/documents/{id}/type", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void linkReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        UUID consultationId = UUID.randomUUID();
        LinkRequest request = new LinkRequest(consultationId);
        when(service.linkToConsultation(id, consultationId)).thenReturn(sample());

        mockMvc.perform(put("/api/documents/{id}/consultation", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void archiveReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doNothing().when(service).archive(id);

        mockMvc.perform(delete("/api/documents/{id}", id))
                .andExpect(status().isNoContent());
    }
}

