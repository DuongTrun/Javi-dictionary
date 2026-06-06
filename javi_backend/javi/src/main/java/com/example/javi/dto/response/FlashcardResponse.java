/**
 * File này: DTO FlashcardResponse.
 * Vai trò: Chứa thông tin phản hồi về Frontend hiển thị chi tiết thẻ ghi nhớ và các thông số thuật toán SM-2.
 * Dùng khi: Controller trả dữ liệu cho client.
 */
package com.example.javi.dto.response;

import java.time.LocalDate;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardResponse {
    Long id;
    Long deckId;
    VocabResponse vocab;
    KanjiResponse kanji;
    GrammarResponse grammar;
    String frontText;
    String backText;
    int repetitions;
    double easeFactor;
    int intervalDays;
    LocalDate nextReviewDate;
    LocalDate lastReviewDate;
    LocalDate createdAt;
}
