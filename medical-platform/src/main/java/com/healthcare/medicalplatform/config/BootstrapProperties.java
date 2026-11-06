package com.healthcare.medicalplatform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record BootstrapProperties(Admin admin) {

    public record Admin(String email, String password) {
    }
}
