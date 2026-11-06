package com.healthcare.medicalplatform.context;

import com.healthcare.medicalplatform.common.NotFoundException;
import com.healthcare.medicalplatform.model.entity.User;
import com.healthcare.medicalplatform.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/** Single access point to the authenticated principal (JWT subject = user id). */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<UUID> id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(auth.getName()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public UUID requireId() {
        return id().orElseThrow(() -> new NotFoundException("No authenticated user"));
    }

    public User require() {
        return userRepository.findById(requireId())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
