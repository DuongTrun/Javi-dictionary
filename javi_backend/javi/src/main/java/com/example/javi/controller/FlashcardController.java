/**
 * File này: Controller FlashcardController.
 * Vai trò: Tiếp nhận các HTTP Request từ Frontend gửi đến đường dẫn /api/v1/flashcards, gọi sang Service xử lý và trả về kết quả JSON.
 * Dùng khi: Người dùng ôn tập thẻ ghi nhớ hoặc thêm/xóa thẻ trong sổ tay của mình.
 */
package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.FlashcardRequest;
import com.example.javi.dto.request.FlashcardReviewRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.FlashcardResponse;
import com.example.javi.service.FlashcardService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/flashcards")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("isAuthenticated()")
public class FlashcardController {
    FlashcardService flashcardService;

    @PostMapping("")
    public ApiResponse<FlashcardResponse> addCard(@Valid @RequestBody FlashcardRequest request) {
        log.info("API: POST /api/v1/flashcards - Thêm thẻ mới vào sổ tay ID: {}", request.getDeckId());
        FlashcardResponse card = flashcardService.addCardToDeck(request);
        return ApiResponse.<FlashcardResponse>builder()
                .code(1000)
                .message("Đã lưu thẻ vào sổ tay học tập")
                .result(card)
                .build();
    }

    @GetMapping("/review/{deckId}")
    public ApiResponse<List<FlashcardResponse>> getCardsForReview(@PathVariable Long deckId) {
        log.info("API: GET /api/v1/flashcards/review/{} - Lấy các thẻ cần ôn tập hôm nay", deckId);
        List<FlashcardResponse> cards = flashcardService.getCardsForReview(deckId);
        return ApiResponse.<List<FlashcardResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thẻ ôn tập thành công")
                .result(cards)
                .build();
    }

    @PostMapping("/review")
    public ApiResponse<FlashcardResponse> submitReview(@Valid @RequestBody FlashcardReviewRequest request) {
        log.info("API: POST /api/v1/flashcards/review - Gửi kết quả đánh giá thẻ ID: {}, rating: {}", 
                request.getCardId(), request.getRating());
        FlashcardResponse card = flashcardService.submitReview(request);
        return ApiResponse.<FlashcardResponse>builder()
                .code(1000)
                .message("Đã cập nhật lịch ôn tập của thẻ")
                .result(card)
                .build();
    }

    @GetMapping("/deck/{deckId}")
    public ApiResponse<List<FlashcardResponse>> getCardsByDeck(@PathVariable Long deckId) {
        log.info("API: GET /api/v1/flashcards/deck/{} - Lấy toàn bộ thẻ của sổ tay này", deckId);
        List<FlashcardResponse> cards = flashcardService.getCardsByDeckId(deckId);
        return ApiResponse.<List<FlashcardResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thẻ thành công")
                .result(cards)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCard(@PathVariable Long id) {
        log.info("API: DELETE /api/v1/flashcards/{} - Yêu cầu xóa thẻ ghi nhớ", id);
        flashcardService.removeCard(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa thẻ ghi nhớ thành công")
                .build();
    }
}
