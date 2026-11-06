package com.healthcare.medicalplatform.config;

import com.healthcare.medicalplatform.services.DiagnosticEngine;
import com.healthcare.medicalplatform.services.DiagnosticEngine.EngineResult;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;

@Configuration
@EnableScheduling
public class SchedulingConfig {

    /**
     * Placeholder engine returning no findings. When the real computer-vision engine exists,
     * delete this bean and register your own DiagnosticEngine implementation.
     */
    @Bean
    DiagnosticEngine diagnosticEngine() {
        return (file, contentType) -> new EngineResult(List.of());
    }
}
