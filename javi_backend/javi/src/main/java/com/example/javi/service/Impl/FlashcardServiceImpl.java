/**
 * File này: Triển khai FlashcardServiceImpl.
 * Vai trò: Thực thi logic nghiệp vụ cho Thẻ ghi nhớ (Flashcard) bao gồm thêm thẻ, xóa thẻ, lấy thẻ đến hạn ôn và tính toán lịch ôn tập theo thuật toán SuperMemo-2 (SM-2).
 * Dùng khi: Controller gọi xử lý nghiệp vụ đối với thẻ ghi nhớ.
 */
package com.example.javi.service.Impl;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.FlashcardRequest;
import com.example.javi.dto.request.FlashcardReviewRequest;
import com.example.javi.dto.response.FlashcardResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.FlashcardMapper;
import com.example.javi.repository.*;
import com.example.javi.service.FlashcardService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FlashcardServiceImpl implements FlashcardService {
    FlashcardRepository flashcardRepository;
    StudyDeckRepository studyDeckRepository;
    VocabulariesRepository vocabulariesRepository;
    KanjiRepository kanjiRepository;
    GrammarRepository grammarRepository;
    FlashcardMapper flashcardMapper;
    SecurityUtil securityUtil;

    @Override
    @Transactional
    public FlashcardResponse addCardToDeck(FlashcardRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Yêu cầu thêm thẻ ghi nhớ vào sổ tay ID: {} bởi user: {}", request.getDeckId(), currentUser.getEmail());

        StudyDeck deck = studyDeckRepository.findById(request.getDeckId())
                .orElseThrow(() -> new AppException(ErrorCode.DECK_NOT_FOUND));

        // Kiểm tra quyền sở hữu sổ tay
        if (!deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra trùng lặp dựa trên loại thẻ
        if (request.getVocabId() != null) {
            if (flashcardRepository.existsByStudyDeckIdAndVocabularyVocabId(request.getDeckId(), request.getVocabId())) {
                throw new AppException(ErrorCode.CARD_ALREADY_EXISTS);
            }
        } else if (request.getKanjiId() != null) {
            if (flashcardRepository.existsByStudyDeckIdAndKanjiId(request.getDeckId(), request.getKanjiId())) {
                throw new AppException(ErrorCode.CARD_ALREADY_EXISTS);
            }
        } else if (request.getGrammarId() != null) {
            if (flashcardRepository.existsByStudyDeckIdAndGrammarGrammarId(request.getDeckId(), request.getGrammarId())) {
                throw new AppException(ErrorCode.CARD_ALREADY_EXISTS);
            }
        }

        // Tạo thẻ mới
        Flashcard card = Flashcard.builder()
                .studyDeck(deck)
                .frontText(request.getFrontText())
                .backText(request.getBackText())
                .nextReviewDate(LocalDate.now()) // Mặc định ôn tập ngay lập tức
                .build();

        // Gán liên kết thực thể từ điển nếu có
        if (request.getVocabId() != null) {
            Vocabularies vocab = vocabulariesRepository.findById(request.getVocabId())
                    .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
            card.setVocabulary(vocab);
        }
        if (request.getKanjiId() != null) {
            Kanji kanji = kanjiRepository.findById(request.getKanjiId())
                    .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
            card.setKanji(kanji);
        }
        if (request.getGrammarId() != null) {
            Grammar grammar = grammarRepository.findById(request.getGrammarId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_NOT_FOUND));
            card.setGrammar(grammar);
        }

        card = flashcardRepository.save(card);
        log.info("Thêm thành công thẻ ghi nhớ ID: {} vào sổ tay ID: {}", card.getId(), deck.getId());

        return flashcardMapper.toResponse(card);
    }

    @Override
    public List<FlashcardResponse> getCardsForReview(Long deckId) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Lấy danh sách thẻ cần ôn tập hôm nay của sổ tay ID: {} bởi user: {}", deckId, currentUser.getEmail());

        StudyDeck deck = studyDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.DECK_NOT_FOUND));

        if (!deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Lấy thẻ có nextReviewDate <= ngày hôm nay
        return flashcardRepository.findByStudyDeckIdAndNextReviewDateLessThanEqual(deckId, LocalDate.now()).stream()
                .map(flashcardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FlashcardResponse submitReview(FlashcardReviewRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Gửi kết quả ôn tập cho thẻ ID: {}, đánh giá: {} bởi user: {}", request.getCardId(), request.getRating(), currentUser.getEmail());

        Flashcard card = flashcardRepository.findById(request.getCardId())
                .orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));

        // Kiểm tra quyền sở hữu sổ tay chứa thẻ
        if (!card.getStudyDeck().getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // --- ÁP DỤNG THUẬT TOÁN SUPERMEMO-2 (SM-2) ---
        // Quy đổi rating (1, 2, 3, 4) sang quality (1, 3, 4, 5) để tính toán chuẩn SM-2
        int quality = switch (request.getRating()) {
            case 1 -> 1; // Again - quên hoàn toàn (SM-2 quality = 1)
            case 2 -> 3; // Hard - nhớ mang máng (SM-2 quality = 3)
            case 3 -> 4; // Good - nhớ tốt (SM-2 quality = 4)
            case 4 -> 5; // Easy - thuộc làu làu (SM-2 quality = 5)
            default -> 4;
        };

        int repetitions = card.getRepetitions();
        double easeFactor = card.getEaseFactor();
        int intervalDays = card.getIntervalDays();

        if (quality < 3) {
            // Trả lời sai (Again/Quên): Bắt đầu lại
            repetitions = 0;
            intervalDays = 1; // Ôn tập lại vào ngày mai
        } else {
            // Trả lời đúng (Hard/Good/Easy)
            if (repetitions == 0) {
                intervalDays = 1;
            } else if (repetitions == 1) {
                intervalDays = 6; // Lần 2 cách 6 ngày
            } else {
                intervalDays = (int) Math.round(intervalDays * easeFactor);
            }
            repetitions++;
        }

        // Cập nhật hệ số độ dễ (ease factor)
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3; // Giới hạn dưới của SM-2
        }

        // Cập nhật các thông số vào thực thể
        card.setRepetitions(repetitions);
        card.setEaseFactor(easeFactor);
        card.setIntervalDays(intervalDays);
        card.setLastReviewDate(LocalDate.now());
        card.setNextReviewDate(LocalDate.now().plusDays(intervalDays));

        card = flashcardRepository.save(card);
        log.info("Cập nhật lịch ôn tập thẻ ID: {} thành công. Ôn tiếp sau {} ngày (vào ngày {})", 
                card.getId(), intervalDays, card.getNextReviewDate());

        return flashcardMapper.toResponse(card);
    }

    @Override
    public List<FlashcardResponse> getCardsByDeckId(Long deckId) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Lấy toàn bộ thẻ ghi nhớ của sổ tay ID: {} bởi user: {}", deckId, currentUser.getEmail());

        StudyDeck deck = studyDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.DECK_NOT_FOUND));

        if (!deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return flashcardRepository.findByStudyDeckId(deckId).stream()
                .map(flashcardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeCard(Long cardId) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Yêu cầu xóa thẻ ghi nhớ ID: {} bởi user: {}", cardId, currentUser.getEmail());

        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));

        if (!card.getStudyDeck().getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        flashcardRepository.delete(card);
        log.info("Xóa thành công thẻ ghi nhớ ID: {}", cardId);
    }
}
