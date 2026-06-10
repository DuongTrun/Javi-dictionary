package com.example.javi.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabResponse;
import com.example.javi.entity.Vocabularies;

import reactor.core.publisher.Flux;

public interface VocabulariesService {
    VocabResponse createVocabulary(VocabRequest request);

    VocabResponse updateVocabulary(Long id, VocabUpdateDTO request);

    List<VocabResponse> searchVocabularies(String keyword);

    VocabResponse getVocabularyByWord(String word);

    VocabResponse getVocabularyById(Long id);

    Page<VocabResponse> getAllVocabulariesByFilter(Specification<Vocabularies> spec, Pageable pageable, String filter);

    String explainVocabulary(String word);

    Flux<String> streamExplainVocabulary(String word);

    void deleteVocabularyById(Long id);
}

