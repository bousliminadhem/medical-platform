package com.healthcare.medicalplatform.repository;

import com.healthcare.medicalplatform.model.entity.LookupValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LookupValueRepository extends JpaRepository<LookupValue, Long> {

    List<LookupValue> findByCategoryAndActiveTrueOrderByLabelAsc(String category);

    List<LookupValue> findByCategoryOrderByLabelAsc(String category);

    Optional<LookupValue> findByCategoryAndCode(String category, String code);

    Optional<LookupValue> findByCategoryAndLabelIgnoreCase(String category, String label);

    boolean existsByCategoryAndCode(String category, String code);
}
