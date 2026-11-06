package com.healthcare.medicalplatform.model.dto;

import com.healthcare.medicalplatform.model.entity.LookupValue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class LookupDtos {

    private LookupDtos() {
    }

    public record CreateLookupRequest(
            @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]*") @Size(max = 64) String category,
            @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]*") @Size(max = 64) String code,
            @NotBlank @Size(max = 128) String label) {
    }

    public record UpdateLookupRequest(
            @Size(min = 1, max = 128) String label,
            Boolean active) {
    }

    public record LookupResponse(Long id, String category, String code, String label, boolean active) {
        public static LookupResponse from(LookupValue v) {
            return new LookupResponse(v.getId(), v.getCategory(), v.getCode(), v.getLabel(), v.isActive());
        }
    }
}
