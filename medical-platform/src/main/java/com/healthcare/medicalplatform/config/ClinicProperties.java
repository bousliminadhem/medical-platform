package com.healthcare.medicalplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;

@ConfigurationProperties(prefix = "app.clinic")
public record ClinicProperties(ZoneId zone) {
    public ClinicProperties {
        if (zone == null) zone = ZoneId.of("Africa/Tunis");
    }
}
