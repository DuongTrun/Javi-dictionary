/**
 * File này: Entity Flashcard.
 * Vai trò: Đại diện cho thẻ ghi nhớ lưu thông tin từ vựng, Kanji, Ngữ pháp hoặc nội dung tự nhập và các chỉ số ôn tập SM-2.
 * Dùng khi: Hibernate đồng bộ ánh xạ bảng 'flashcards' dưới database.
 */
package com.example.javi.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Flashcard extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_id")
    Long id;

    @ManyToOne
    @JoinColumn(name = "deck_id", nullable = false)
    StudyDeck studyDeck;

    @ManyToOne
    @JoinColumn(name = "vocab_id", nullable = true)
    Vocabularies vocabulary;

    @ManyToOne
    @JoinColumn(name = "kanji_id", nullable = true)
    Kanji kanji;

    @ManyToOne
    @JoinColumn(name = "grammar_id", nullable = true)
    Grammar grammar;

    @Column(name = "front_text", columnDefinition = "TEXT")
    String frontText; // Dùng khi người dùng tự tạo thẻ thủ công

    @Column(name = "back_text", columnDefinition = "TEXT")
    String backText; // Dùng khi người dùng tự tạo thẻ thủ công

    // --- CÁC TRƯỜNG PHỤC VỤ THUẬT TOÁN SM-2 ---

    @Builder.Default
    @Column(name = "repetitions", nullable = false)
    int repetitions = 0; // Số lần ôn tập liên tiếp thành công

    @Builder.Default
    @Column(name = "ease_factor", nullable = false)
    double easeFactor = 2.5; // Hệ số dễ (ease factor), mặc định ban đầu là 2.5

    @Builder.Default
    @Column(name = "interval_days", nullable = false)
    int intervalDays = 0; // Khoảng cách số ngày ôn tập tiếp theo

    @Column(name = "next_review_date", nullable = false)
    LocalDate nextReviewDate; // Ngày ôn tập tiếp theo

    @Column(name = "last_review_date")
    LocalDate lastReviewDate; // Ngày ôn tập gần nhất

    @PrePersist
    protected void onPrePersistFlashcard() {
        if (nextReviewDate == null) {
            nextReviewDate = LocalDate.now();
        }
    }
}
