package com.healthcare.medicalplatform.services;

import com.healthcare.medicalplatform.config.AppSecurityProperties;
import com.healthcare.medicalplatform.model.dto.AuthDtos.AuthResponse;
import com.healthcare.medicalplatform.model.dto.AuthDtos.UserSummary;
import com.healthcare.medicalplatform.model.entity.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final AppSecurityProperties props;

    public JwtService(JwtEncoder encoder, AppSecurityProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public AuthResponse issue(User user) {
        Instant now = Instant.now();
        Instant expires = now.plus(props.jwt().expiration());

        List<String> roles = user.getRoles().stream().map(Enum::name).sorted().toList();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.jwt().issuer())
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(expires)
                .claim("roles", roles)
                .claim("ver", user.getTokenVersion())
                .build();

        String token = encoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        return new AuthResponse(token, "Bearer", expires, UserSummary.from(user));
    }
}
