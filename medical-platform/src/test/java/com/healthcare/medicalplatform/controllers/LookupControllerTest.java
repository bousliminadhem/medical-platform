package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.LookupDtos.LookupResponse;
import com.healthcare.medicalplatform.services.LookupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LookupController.class)
@AutoConfigureMockMvc(addFilters = false)
class LookupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LookupService lookupService;

    @Test
    void listReturnsOk() throws Exception {
        when(lookupService.listActive("GENDER")).thenReturn(List.of(
                new LookupResponse(1L, "GENDER", "MALE", "Male", true)));

        mockMvc.perform(get("/api/lookups/GENDER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("MALE"));
    }
}

