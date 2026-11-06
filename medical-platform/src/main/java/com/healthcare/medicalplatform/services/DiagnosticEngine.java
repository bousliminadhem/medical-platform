package com.healthcare.medicalplatform.services;

import java.nio.file.Path;
import java.util.List;

/** Port to the external analysis engine. Implement it (HTTP client, gRPC...) and register it as a bean. */
@FunctionalInterface
public interface DiagnosticEngine {

    EngineResult analyze(Path file, String contentType) throws Exception;

    record EngineResult(List<EngineFinding> findings) {
    }

    record EngineFinding(String label, double confidence, String annotation) {
    }
}
