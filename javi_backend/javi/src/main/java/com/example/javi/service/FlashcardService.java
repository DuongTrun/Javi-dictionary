/**
 * File này: Interface FlashcardService.
 * Vai trò: Khai báo các nghiệp vụ quản lý Thẻ ghi nhớ (Flashcard) và thuật toán SM-2.
 * Dùng khi: Controller muốn gọi xử lý liên quan đến thẻ ghi nhớ.
 */
package com.example.javi.service;

import java.util.List;

import com.example.javi.dto.request.FlashcardRequest;
import com.example.javi.dto.request.FlashcardReviewRequest;
import com.example.javi.dto.response.FlashcardResponse;

public interface FlashcardService {
    // Thêm một thẻ ghi nhớ mới vào sổ tay ôn tập
    FlashcardResponse addCardToDeck(FlashcardRequest request);

    // Lấy danh sách các thẻ cần ôn tập ngày hôm nay của một sổ tay
    List<FlashcardResponse> getCardsForReview(Long deckId);

    // Gửi kết quả đánh giá ôn tập để tính lại lịch ôn tiếp theo (thuật toán SM-2)
    FlashcardResponse submitReview(FlashcardReviewRequest request);

    // Lấy toàn bộ thẻ ghi nhớ của một sổ tay
    List<FlashcardResponse> getCardsByDeckId(Long deckId);

    // Xóa thẻ ghi nhớ theo ID
    void removeCard(Long cardId);
}
