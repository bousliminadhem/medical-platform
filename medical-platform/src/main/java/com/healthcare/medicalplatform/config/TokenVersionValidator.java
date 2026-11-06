package com.healthcare.medicalplatform.config;

import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.repository.UserRepository;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Rejects tokens whose account is gone/disabled or whose "ver" claim is stale.
 * This is what makes logout, password change and archiving revoke existing tokens
 * even though the JWTs themselves are stateless.
 */
@Component
public class TokenVersionValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID =
            new OAuth2Error("invalid_token", "Token has been revoked or the account is inactive", null);

    private final UserRepository userRepository;

    public TokenVersionValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            Number ver = jwt.getClaim("ver");
            if (ver == null) {
                return OAuth2TokenValidatorResult.failure(INVALID);
            }
            return userRepository.findById(userId)
                    .filter(User::isEnabled)
                    .filter(u -> u.getTokenVersion() == ver.longValue())
                    .map(u -> OAuth2TokenValidatorResult.success())
                    .orElseGet(() -> OAuth2TokenValidatorResult.failure(INVALID));
        } catch (IllegalArgumentException ex) {
            return OAuth2TokenValidatorResult.failure(INVALID);
        }
    }
}
