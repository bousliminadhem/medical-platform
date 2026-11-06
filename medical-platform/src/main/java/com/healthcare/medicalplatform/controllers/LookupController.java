package com.healthcare.medicalplatform.controllers;

import com.healthcare.medicalplatform.model.dto.LookupDtos.LookupResponse;
import com.healthcare.medicalplatform.services.LookupService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** S1.2 read active lookup values: any authenticated user. */
@RestController
@RequestMapping("/api/lookups")
public class LookupController {

    private final LookupService lookupService;

    public LookupController(LookupService lookupService) {
        this.lookupService = lookupService;
    }

    @GetMapping("/{category}")
    public List<LookupResponse> list(@PathVariable String category) {
        return lookupService.listActive(category);
    }
}
