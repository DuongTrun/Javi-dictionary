package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.GrammarCheckSourceText;
import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.GrammarCheckResult;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.TranslateResponse;

import reactor.core.publisher.Flux;

public interface GeminiService {
    TranslateResponse translateText(TranslateRequest request);

    Flux<String> streamTranslateText(TranslateRequest request);

    TranslateResponse translateImage(MultipartFile file, String targetLang, String sourceLang);


    String explainWord(String word);

    Flux<String> streamExplainWord(String word);

    GrammarCheckResult checkGrammar(GrammarCheckSourceText request);

    KanjiDecompositionResult analyzeKanjiStructure(String kanji);
}

