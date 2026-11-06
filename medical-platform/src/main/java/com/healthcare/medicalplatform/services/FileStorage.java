package com.healthcare.medicalplatform.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** 5.6 local-disk storage. Swap for S3/MinIO by re-implementing these three methods. */
@Component
public class FileStorage {

    private final Path root;

    public FileStorage(@Value("${app.storage.root:./storage}") String rootDir) {
        this.root = Path.of(rootDir).toAbsolutePath().normalize();
    }

    /** @return storage path relative to the root (generated name, never user input) */
    public String store(UUID patientId, byte[] content) throws IOException {
        Path dir = root.resolve(patientId.toString());
        Files.createDirectories(dir);
        String name = UUID.randomUUID().toString();
        Files.write(dir.resolve(name), content);
        return patientId + "/" + name;
    }

    public Path resolve(String relativePath) {
        Path p = root.resolve(relativePath).normalize();
        if (!p.startsWith(root)) {
            throw new IllegalStateException("Illegal storage path");
        }
        return p;
    }
}
