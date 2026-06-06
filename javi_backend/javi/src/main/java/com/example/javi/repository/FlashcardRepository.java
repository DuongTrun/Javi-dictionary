/**
 * File này: Repository FlashcardRepository.
 * Vai trò: Thực hiện các truy vấn dữ liệu liên quan đến bảng 'flashcards' dưới MySQL.
 * Dùng khi: Service muốn lấy thẻ cần ôn tập hôm nay, đếm số thẻ, hoặc kiểm tra xem từ vựng/Kanji đã được lưu vào sổ tay hay chưa.
 */
package com.example.javi.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Flashcard;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long>, JpaSpecificationExecutor<Flashcard> {
    // Lấy toàn bộ thẻ ghi nhớ thuộc một sổ tay cụ thể
    List<Flashcard> findByStudyDeckId(Long deckId);

    // Đếm tổng số thẻ ghi nhớ thuộc một sổ tay cụ thể
    long countByStudyDeckId(Long deckId);

    // Lấy danh sách thẻ ghi nhớ cần ôn tập (nextReviewDate <= ngày hiện tại) của một sổ tay cụ thể
    List<Flashcard> findByStudyDeckIdAndNextReviewDateLessThanEqual(Long deckId, LocalDate date);

    // Đếm số thẻ cần ôn tập hôm nay của một sổ tay cụ thể
    long countByStudyDeckIdAndNextReviewDateLessThanEqual(Long deckId, LocalDate date);

    // Kiểm tra xem từ vựng đã tồn tại trong sổ tay cụ thể này chưa (tránh lưu trùng lặp)
    boolean existsByStudyDeckIdAndVocabularyVocabId(Long deckId, Long vocabId);

    // Kiểm tra xem chữ Kanji đã tồn tại trong sổ tay cụ thể này chưa
    boolean existsByStudyDeckIdAndKanjiId(Long deckId, Long kanjiId);

    // Kiểm tra xem mẫu ngữ pháp đã tồn tại trong sổ tay cụ thể này chưa
    boolean existsByStudyDeckIdAndGrammarGrammarId(Long deckId, Long grammarId);
}
