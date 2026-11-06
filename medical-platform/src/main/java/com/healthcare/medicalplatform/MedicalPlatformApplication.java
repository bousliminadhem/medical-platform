package com.healthcare.medicalplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MedicalPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicalPlatformApplication.class, args);
    }
}
