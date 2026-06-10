package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.VocabResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Users;
import com.example.javi.entity.Vocabularies;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.HistorySearchService;
import com.example.javi.service.VocabulariesService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/vocab")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VocabulariesController {
    VocabulariesService vocabulariesService;
    HistorySearchService historySearchService;
    SecurityUtil securityUtil;

    @PostMapping("")
    @PreAuthorize("hasAuthority('CREATE_VOCABULARY')")
    public ApiResponse<VocabResponse> createVocabulary(@Valid @RequestBody VocabRequest request) {
        boolean isJapanese = ValidationUtils.isJapanese(request.getWord());
        if (!isJapanese) {
            throw new AppException(ErrorCode.INVALID_WORD);
        }
        VocabResponse vocabResponse = vocabulariesService.createVocabulary(request);
        return ApiResponse.<VocabResponse>builder()
                .message("Tạo từ vựng thành công")
                .result(vocabResponse)
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_VOCABULARY')")
    public ApiResponse<VocabResponse> updateVocabulary(
            @PathVariable Long id, @Valid @RequestBody VocabUpdateDTO request) {
        boolean isJapanese = ValidationUtils.isJapanese(request.getWord());
        if (!isJapanese) {
            throw new AppException(ErrorCode.INVALID_WORD);
        }
        VocabResponse vocab = vocabulariesService.updateVocabulary(id, request);
        return ApiResponse.<VocabResponse>builder()
                .message("Cập nhật thành công")
                .result(vocab)
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<List<VocabResponse>> searchVocabularies(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        List<VocabResponse> results = vocabulariesService.searchVocabularies(keyword);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByKeyword(user, keyword, EntityType.WORD);
        }
        return ApiResponse.<List<VocabResponse>>builder()
                .message("Lấy từ vựng thành công")
                .result(results)
                .build();
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<VocabResponse> getVocabularyById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        VocabResponse vocab = vocabulariesService.getVocabularyById(id);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(user, id, EntityType.WORD, vocab.getWord());
        }
        return ResponseEntity.ok(vocab);
    }

    @GetMapping("/search/word/{word}")
    public ApiResponse<VocabResponse> getVocabularyByWord(
            @PathVariable String word,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        VocabResponse vocab = vocabulariesService.getVocabularyByWord(word);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(user, vocab.getId(), EntityType.WORD, vocab.getWord());
        }
        return ApiResponse.<VocabResponse>builder()
                .message("Lấy từ vựng thành công")
                .result(vocab)
                .build();
    }

    @GetMapping("")
    public ApiResponse<Page<VocabResponse>> getAllVocabularyByFilter(
            @Filter Specification<Vocabularies> spec,
            @RequestParam(required = false) String filter,
            @PageableDefault(size = 20, sort = "vocabId") Pageable pageable) {
        return ApiResponse.<Page<VocabResponse>>builder()
                .message("Lấy từ vựng thành công")
                .result(vocabulariesService.getAllVocabulariesByFilter(spec, pageable, filter))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_VOCABULARY')")
    public ApiResponse<Void> deleteVocabulary(@PathVariable Long id) {
        vocabulariesService.deleteVocabularyById(id);
        return ApiResponse.<Void>builder().message("Xóa từ vựng thành công").build();
    }

    @PostMapping("/explain/{word}")
    public ApiResponse<String> explainVocabulary(@PathVariable String word) {
        String response = vocabulariesService.explainVocabulary(word);
        return ApiResponse.<String>builder()
                .message("Giải nghĩa thành công")
                .result(response)
                .build();
    }

    @GetMapping(value = "/explain/stream/{word}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamExplainVocabulary(@PathVariable String word) {
        SseEmitter emitter = new SseEmitter(60000L); // 60s timeout

        vocabulariesService.streamExplainVocabulary(word).subscribe(
            token -> {
                try {
                    emitter.send(SseEmitter.event().data(token));
                } catch (Exception e) {
                    // Ignore or log error
                }
            },
            error -> emitter.completeWithError(error),
            () -> emitter.complete()
        );

        return ResponseEntity.ok()
                .header("X-Accel-Buffering", "no")
                .body(emitter);
    }
}
