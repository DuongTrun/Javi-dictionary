package com.example.javi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.EngineType;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long>, JpaSpecificationExecutor<Translation> {
    Page<Translation> findAllByUserOrderByCreatedAtDesc(Users user, Pageable pageable);

    Optional<Translation> findFirstBySourceTextAndSourceLangAndTargetLangAndEngine(
            String sourceText, String sourceLang, String targetLang, EngineType engine);

    void deleteByUser(Users user);

    void deleteByIdInAndUser(List<Long> ids, Users user);
}
