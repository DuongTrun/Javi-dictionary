/**
 * File này: DTO FlashcardRequest.
 * Vai trò: Chứa dữ liệu gửi từ Frontend khi thêm mới một Thẻ ghi nhớ (Flashcard) vào sổ tay.
 * Dùng khi: Controller tiếp nhận request body tạo flashcard.
 */
package com.example.javi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardRequest {
    @NotNull(message = "ID của sổ tay học tập không được để trống")
    Long deckId;

    Long vocabId; // Nullable - nếu lưu từ vựng từ điển
    Long kanjiId; // Nullable - nếu lưu chữ Kanji từ điển
    Long grammarId; // Nullable - nếu lưu ngữ pháp từ điển

    String frontText; // Nullable - nếu tự định nghĩa mặt trước
    String backText; // Nullable - nếu tự định nghĩa mặt sau
}
