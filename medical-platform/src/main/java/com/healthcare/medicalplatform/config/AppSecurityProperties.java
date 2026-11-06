package com.healthcare.medicalplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.security")
public record AppSecurityProperties(Jwt jwt, int maxFailedAttempts, Duration lockDuration) {

    public record Jwt(String secret, String issuer, Duration expiration) {
        public Jwt {
            if (secret == null || secret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
                throw new IllegalStateException("app.security.jwt.secret must be at least 32 bytes");
            }
        }
    }
}
