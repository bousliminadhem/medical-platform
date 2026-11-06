package com.healthcare.medicalplatform.config;

import com.healthcare.medicalplatform.model.entity.LookupValue;
import com.healthcare.medicalplatform.model.entity.SystemAdministrator;
import com.healthcare.medicalplatform.model.enums.Role;
import com.healthcare.medicalplatform.repository.LookupValueRepository;
import com.healthcare.medicalplatform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/** Seeds reference data (S1) and the first administrator so the system is usable on first start. */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final Map<String, List<String[]>> LOOKUPS = Map.of(
            "GENDER", List.of(
                    new String[]{"MALE", "Male"}, new String[]{"FEMALE", "Female"},
                    new String[]{"OTHER", "Other"}),
            "BLOOD_TYPE", List.of(
                    new String[]{"A_POS", "A+"}, new String[]{"A_NEG", "A-"},
                    new String[]{"B_POS", "B+"}, new String[]{"B_NEG", "B-"},
                    new String[]{"AB_POS", "AB+"}, new String[]{"AB_NEG", "AB-"},
                    new String[]{"O_POS", "O+"}, new String[]{"O_NEG", "O-"}),
            "SPECIALTY", List.of(
                    new String[]{"GENERAL_PRACTICE", "General practice"},
                    new String[]{"CARDIOLOGY", "Cardiology"},
                    new String[]{"DERMATOLOGY", "Dermatology"},
                    new String[]{"PEDIATRICS", "Pediatrics"},
                    new String[]{"RADIOLOGY", "Radiology"}),
            "APPOINTMENT_STATUS", List.of(
                    new String[]{"SCHEDULED", "Scheduled"}, new String[]{"CONFIRMED", "Confirmed"},
                    new String[]{"IN_PROGRESS", "In progress"}, new String[]{"COMPLETED", "Completed"},
                    new String[]{"CANCELLED", "Cancelled"}, new String[]{"NO_SHOW", "No-show"}),
            "DOCUMENT_TYPE", List.of(
                    new String[]{"LAB_RESULT", "Lab result"}, new String[]{"SCAN_REPORT", "Scan report"},
                    new String[]{"PRESCRIPTION", "Prescription"}, new String[]{"OTHER", "Other"})
    );

    private final LookupValueRepository lookupRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BootstrapProperties bootstrap;

    public DataInitializer(LookupValueRepository lookupRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder, BootstrapProperties bootstrap) {
        this.lookupRepository = lookupRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrap = bootstrap;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LOOKUPS.forEach((category, values) -> values.forEach(v -> {
            if (!lookupRepository.existsByCategoryAndCode(category, v[0])) {
                lookupRepository.save(new LookupValue(category, v[0], v[1]));
            }
        }));

        if (!userRepository.existsByRolesContaining(Role.ADMIN)) {
            String email = bootstrap.admin().email().toLowerCase();
            userRepository.save(new SystemAdministrator(email,
                    passwordEncoder.encode(bootstrap.admin().password()), "System", "Administrator"));
            log.warn("Created bootstrap administrator '{}'. Change its password immediately.", email);
        }
    }
}
