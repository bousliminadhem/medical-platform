package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.config.AppSecurityProperties;
import com.healthcare.medicalplatform.model.dto.AuthDtos.AuthResponse;
import com.healthcare.medicalplatform.model.entity.Patient;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";

    @Test
    void issuedTokenCarriesSubjectRolesAndVersion() {
        var key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        var props = new AppSecurityProperties(
                new AppSecurityProperties.Jwt(SECRET, "medical-platform", Duration.ofMinutes(5)), 5,
                Duration.ofMinutes(15));
        var service = new JwtService(new NimbusJwtEncoder(new ImmutableSecret<>(key)), props);

        Patient patient = new Patient("a@b.c", "hash", "Ada", "Lovelace", LocalDate.of(1990, 1, 1));
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(patient, "id", id);

        AuthResponse response = service.issue(patient);

        Jwt jwt = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build()
                .decode(response.accessToken());
        assertEquals(id.toString(), jwt.getSubject());
        assertEquals(List.of("PATIENT"), jwt.getClaimAsStringList("roles"));
        assertEquals(0L, ((Number) jwt.getClaim("ver")).longValue());
    }

    @Test
    void shortSecretIsRejected() {
        assertThrows(IllegalStateException.class,
                () -> new AppSecurityProperties.Jwt("too-short", "x", Duration.ofMinutes(1)));
    }
}

