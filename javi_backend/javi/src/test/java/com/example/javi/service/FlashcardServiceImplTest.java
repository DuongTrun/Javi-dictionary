/**
 * File này: Unit Tests cho FlashcardServiceImpl.
 * Vai trò: Kiểm thử toàn diện logic nghiệp vụ thẻ ghi nhớ bao gồm: thêm thẻ, ôn tập SM-2, xóa thẻ, kiểm tra quyền sở hữu, và trùng lặp.
 * Dùng khi: Chạy bộ kiểm thử tự động để đảm bảo tính đúng đắn của module Flashcard.
 */
package com.example.javi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.javi.dto.request.FlashcardRequest;
import com.example.javi.dto.request.FlashcardReviewRequest;
import com.example.javi.dto.response.FlashcardResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.FlashcardMapper;
import com.example.javi.repository.*;
import com.example.javi.service.Impl.FlashcardServiceImpl;
import com.example.javi.utils.SecurityUtil;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlashcardServiceImpl - Unit Tests")
class FlashcardServiceImplTest {

    @Mock FlashcardRepository flashcardRepository;
    @Mock StudyDeckRepository studyDeckRepository;
    @Mock VocabulariesRepository vocabulariesRepository;
    @Mock KanjiRepository kanjiRepository;
    @Mock GrammarRepository grammarRepository;
    @Mock FlashcardMapper flashcardMapper;
    @Mock SecurityUtil securityUtil;

    @InjectMocks
    FlashcardServiceImpl flashcardService;

    private Users mockUser;
    private StudyDeck mockDeck;

    @BeforeEach
    void setUp() {
        mockUser = new Users();
        mockUser.setId(1L);
        mockUser.setEmail("test@javi.com");

        mockDeck = StudyDeck.builder()
                .id(10L)
                .name("Sổ tay N3")
                .user(mockUser)
                .build();
    }

    // =============================================
    // THÊM THẺ GHI NHỚ VÀO SỔ TAY
    // =============================================
    @Nested
    @DisplayName("addCardToDeck - Thêm thẻ ghi nhớ")
    class AddCardToDeckTests {

        @Test
        @DisplayName("Thêm thẻ từ vựng thành công")
        void shouldAddVocabCardSuccessfully() {
            // Arrange
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.existsByStudyDeckIdAndVocabularyVocabId(10L, 100L)).thenReturn(false);

            Vocabularies vocab = new Vocabularies();
            vocab.setVocabId(100L);
            when(vocabulariesRepository.findById(100L)).thenReturn(Optional.of(vocab));

            Flashcard savedCard = Flashcard.builder()
                    .id(1L)
                    .studyDeck(mockDeck)
                    .vocabulary(vocab)
                    .nextReviewDate(LocalDate.now())
                    .build();
            when(flashcardRepository.save(any(Flashcard.class))).thenReturn(savedCard);

            FlashcardResponse expectedResponse = FlashcardResponse.builder()
                    .id(1L)
                    .deckId(10L)
                    .build();
            when(flashcardMapper.toResponse(savedCard)).thenReturn(expectedResponse);

            FlashcardRequest request = FlashcardRequest.builder()
                    .deckId(10L)
                    .vocabId(100L)
                    .build();

            // Act
            FlashcardResponse result = flashcardService.addCardToDeck(request);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals(10L, result.getDeckId());
            verify(flashcardRepository).save(any(Flashcard.class));
        }

        @Test
        @DisplayName("Thêm thẻ Kanji thành công")
        void shouldAddKanjiCardSuccessfully() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.existsByStudyDeckIdAndKanjiId(10L, 200L)).thenReturn(false);

            Kanji kanji = new Kanji();
            kanji.setId(200L);
            when(kanjiRepository.findById(200L)).thenReturn(Optional.of(kanji));

            Flashcard savedCard = Flashcard.builder()
                    .id(2L).studyDeck(mockDeck).kanji(kanji).nextReviewDate(LocalDate.now()).build();
            when(flashcardRepository.save(any(Flashcard.class))).thenReturn(savedCard);
            when(flashcardMapper.toResponse(savedCard)).thenReturn(
                    FlashcardResponse.builder().id(2L).deckId(10L).build());

            FlashcardRequest request = FlashcardRequest.builder().deckId(10L).kanjiId(200L).build();

            FlashcardResponse result = flashcardService.addCardToDeck(request);

            assertNotNull(result);
            assertEquals(2L, result.getId());
            verify(kanjiRepository).findById(200L);
        }

        @Test
        @DisplayName("Thêm thẻ Ngữ pháp thành công")
        void shouldAddGrammarCardSuccessfully() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.existsByStudyDeckIdAndGrammarGrammarId(10L, 300L)).thenReturn(false);

            Grammar grammar = new Grammar();
            grammar.setGrammarId(300L);
            when(grammarRepository.findById(300L)).thenReturn(Optional.of(grammar));

            Flashcard savedCard = Flashcard.builder()
                    .id(3L).studyDeck(mockDeck).grammar(grammar).nextReviewDate(LocalDate.now()).build();
            when(flashcardRepository.save(any(Flashcard.class))).thenReturn(savedCard);
            when(flashcardMapper.toResponse(savedCard)).thenReturn(
                    FlashcardResponse.builder().id(3L).deckId(10L).build());

            FlashcardRequest request = FlashcardRequest.builder().deckId(10L).grammarId(300L).build();

            FlashcardResponse result = flashcardService.addCardToDeck(request);

            assertNotNull(result);
            assertEquals(3L, result.getId());
            verify(grammarRepository).findById(300L);
        }

        @Test
        @DisplayName("Thêm thẻ tùy chỉnh (chỉ có frontText/backText)")
        void shouldAddCustomCardSuccessfully() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));

            Flashcard savedCard = Flashcard.builder()
                    .id(4L).studyDeck(mockDeck).frontText("食べる").backText("Ăn")
                    .nextReviewDate(LocalDate.now()).build();
            when(flashcardRepository.save(any(Flashcard.class))).thenReturn(savedCard);
            when(flashcardMapper.toResponse(savedCard)).thenReturn(
                    FlashcardResponse.builder().id(4L).deckId(10L).frontText("食べる").backText("Ăn").build());

            FlashcardRequest request = FlashcardRequest.builder()
                    .deckId(10L).frontText("食べる").backText("Ăn").build();

            FlashcardResponse result = flashcardService.addCardToDeck(request);

            assertNotNull(result);
            assertEquals("食べる", result.getFrontText());
            assertEquals("Ăn", result.getBackText());
        }

        @Test
        @DisplayName("Từ chối thêm thẻ trùng lặp - từ vựng đã tồn tại trong sổ tay")
        void shouldRejectDuplicateVocabCard() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.existsByStudyDeckIdAndVocabularyVocabId(10L, 100L)).thenReturn(true);

            FlashcardRequest request = FlashcardRequest.builder().deckId(10L).vocabId(100L).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.addCardToDeck(request));
            assertEquals(ErrorCode.CARD_ALREADY_EXISTS, ex.getErrorCode());
            verify(flashcardRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối thêm thẻ khi sổ tay không tồn tại")
        void shouldRejectWhenDeckNotFound() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(999L)).thenReturn(Optional.empty());

            FlashcardRequest request = FlashcardRequest.builder().deckId(999L).vocabId(100L).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.addCardToDeck(request));
            assertEquals(ErrorCode.DECK_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Từ chối thêm thẻ khi người dùng không sở hữu sổ tay")
        void shouldRejectWhenUserDoesNotOwnDeck() {
            Users otherUser = new Users();
            otherUser.setId(99L);

            StudyDeck otherDeck = StudyDeck.builder().id(10L).name("Sổ tay của người khác").user(otherUser).build();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(otherDeck));

            FlashcardRequest request = FlashcardRequest.builder().deckId(10L).vocabId(100L).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.addCardToDeck(request));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Từ chối thêm thẻ khi từ vựng không tồn tại")
        void shouldRejectWhenVocabNotFound() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.existsByStudyDeckIdAndVocabularyVocabId(10L, 999L)).thenReturn(false);
            when(vocabulariesRepository.findById(999L)).thenReturn(Optional.empty());

            FlashcardRequest request = FlashcardRequest.builder().deckId(10L).vocabId(999L).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.addCardToDeck(request));
            assertEquals(ErrorCode.WORD_NOT_FOUND, ex.getErrorCode());
        }
    }

    // =============================================
    // THUẬT TOÁN SUPERMEMO-2 (SM-2)
    // =============================================
    @Nested
    @DisplayName("submitReview - Thuật toán SM-2")
    class SubmitReviewTests {

        private Flashcard createBaseCard() {
            Flashcard card = Flashcard.builder()
                    .id(1L)
                    .studyDeck(mockDeck)
                    .repetitions(0)
                    .easeFactor(2.5)
                    .intervalDays(0)
                    .nextReviewDate(LocalDate.now())
                    .build();
            return card;
        }

        @Test
        @DisplayName("Rating 1 (Again/Quên): Reset lại repetitions về 0, interval = 1 ngày")
        void shouldResetOnAgain() {
            Flashcard card = createBaseCard();
            card.setRepetitions(5);
            card.setIntervalDays(30);

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
            when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(i -> i.getArgument(0));
            when(flashcardMapper.toResponse(any())).thenReturn(FlashcardResponse.builder().id(1L).build());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(1).build();
            flashcardService.submitReview(request);

            ArgumentCaptor<Flashcard> captor = ArgumentCaptor.forClass(Flashcard.class);
            verify(flashcardRepository).save(captor.capture());
            Flashcard saved = captor.getValue();

            assertEquals(0, saved.getRepetitions());
            assertEquals(1, saved.getIntervalDays());
            assertEquals(LocalDate.now().plusDays(1), saved.getNextReviewDate());
            assertEquals(LocalDate.now(), saved.getLastReviewDate());
        }

        @Test
        @DisplayName("Rating 3 (Good) lần đầu tiên: repetitions=1, interval=1 ngày")
        void shouldSetInterval1OnFirstGood() {
            Flashcard card = createBaseCard();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
            when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(i -> i.getArgument(0));
            when(flashcardMapper.toResponse(any())).thenReturn(FlashcardResponse.builder().id(1L).build());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(3).build();
            flashcardService.submitReview(request);

            ArgumentCaptor<Flashcard> captor = ArgumentCaptor.forClass(Flashcard.class);
            verify(flashcardRepository).save(captor.capture());
            Flashcard saved = captor.getValue();

            assertEquals(1, saved.getRepetitions());
            assertEquals(1, saved.getIntervalDays());
        }

        @Test
        @DisplayName("Rating 3 (Good) lần thứ 2: repetitions=2, interval=6 ngày")
        void shouldSetInterval6OnSecondGood() {
            Flashcard card = createBaseCard();
            card.setRepetitions(1);
            card.setIntervalDays(1);

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
            when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(i -> i.getArgument(0));
            when(flashcardMapper.toResponse(any())).thenReturn(FlashcardResponse.builder().id(1L).build());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(3).build();
            flashcardService.submitReview(request);

            ArgumentCaptor<Flashcard> captor = ArgumentCaptor.forClass(Flashcard.class);
            verify(flashcardRepository).save(captor.capture());
            Flashcard saved = captor.getValue();

            assertEquals(2, saved.getRepetitions());
            assertEquals(6, saved.getIntervalDays());
        }

        @Test
        @DisplayName("Rating 4 (Easy) lần thứ 3+: interval nhân hệ số easeFactor")
        void shouldMultiplyIntervalByEaseFactorOnSubsequentEasy() {
            Flashcard card = createBaseCard();
            card.setRepetitions(2);
            card.setIntervalDays(6);
            card.setEaseFactor(2.5);

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
            when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(i -> i.getArgument(0));
            when(flashcardMapper.toResponse(any())).thenReturn(FlashcardResponse.builder().id(1L).build());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(4).build();
            flashcardService.submitReview(request);

            ArgumentCaptor<Flashcard> captor = ArgumentCaptor.forClass(Flashcard.class);
            verify(flashcardRepository).save(captor.capture());
            Flashcard saved = captor.getValue();

            assertEquals(3, saved.getRepetitions());
            // 6 * 2.5 = 15 (làm tròn)
            assertEquals(15, saved.getIntervalDays());
            assertEquals(LocalDate.now().plusDays(15), saved.getNextReviewDate());
        }

        @Test
        @DisplayName("Rating 2 (Hard): Hệ số easeFactor giảm nhưng không thấp hơn 1.3")
        void shouldNotDropEaseFactorBelow1Point3() {
            Flashcard card = createBaseCard();
            card.setRepetitions(2);
            card.setIntervalDays(6);
            card.setEaseFactor(1.3); // Đã ở mức tối thiểu

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
            when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(i -> i.getArgument(0));
            when(flashcardMapper.toResponse(any())).thenReturn(FlashcardResponse.builder().id(1L).build());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(2).build();
            flashcardService.submitReview(request);

            ArgumentCaptor<Flashcard> captor = ArgumentCaptor.forClass(Flashcard.class);
            verify(flashcardRepository).save(captor.capture());
            Flashcard saved = captor.getValue();

            assertTrue(saved.getEaseFactor() >= 1.3, "Ease factor phải >= 1.3");
        }

        @Test
        @DisplayName("Từ chối ôn tập khi thẻ không tồn tại")
        void shouldRejectReviewWhenCardNotFound() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(999L)).thenReturn(Optional.empty());

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(999L).rating(3).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.submitReview(request));
            assertEquals(ErrorCode.CARD_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Từ chối ôn tập khi người dùng không sở hữu sổ tay chứa thẻ")
        void shouldRejectReviewWhenUserDoesNotOwnDeck() {
            Users otherUser = new Users();
            otherUser.setId(99L);
            StudyDeck otherDeck = StudyDeck.builder().id(20L).user(otherUser).build();
            Flashcard card = Flashcard.builder().id(1L).studyDeck(otherDeck).build();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));

            FlashcardReviewRequest request = FlashcardReviewRequest.builder().cardId(1L).rating(3).build();

            AppException ex = assertThrows(AppException.class, () -> flashcardService.submitReview(request));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }
    }

    // =============================================
    // LẤY DANH SÁCH THẺ CẦN ÔN TẬP
    // =============================================
    @Nested
    @DisplayName("getCardsForReview - Lấy thẻ ôn tập")
    class GetCardsForReviewTests {

        @Test
        @DisplayName("Lấy danh sách thẻ cần ôn hôm nay thành công")
        void shouldReturnCardsForReviewToday() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));

            Flashcard card1 = Flashcard.builder().id(1L).studyDeck(mockDeck).nextReviewDate(LocalDate.now()).build();
            Flashcard card2 = Flashcard.builder().id(2L).studyDeck(mockDeck).nextReviewDate(LocalDate.now().minusDays(1)).build();

            when(flashcardRepository.findByStudyDeckIdAndNextReviewDateLessThanEqual(eq(10L), any(LocalDate.class)))
                    .thenReturn(List.of(card1, card2));
            when(flashcardMapper.toResponse(card1)).thenReturn(FlashcardResponse.builder().id(1L).build());
            when(flashcardMapper.toResponse(card2)).thenReturn(FlashcardResponse.builder().id(2L).build());

            List<FlashcardResponse> result = flashcardService.getCardsForReview(10L);

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("Trả về danh sách rỗng khi không có thẻ nào cần ôn")
        void shouldReturnEmptyWhenNoCardsForReview() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(mockDeck));
            when(flashcardRepository.findByStudyDeckIdAndNextReviewDateLessThanEqual(eq(10L), any(LocalDate.class)))
                    .thenReturn(List.of());

            List<FlashcardResponse> result = flashcardService.getCardsForReview(10L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Từ chối khi sổ tay không thuộc về người dùng hiện tại")
        void shouldRejectWhenUnauthorizedDeck() {
            Users otherUser = new Users();
            otherUser.setId(99L);
            StudyDeck otherDeck = StudyDeck.builder().id(10L).user(otherUser).build();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(studyDeckRepository.findById(10L)).thenReturn(Optional.of(otherDeck));

            AppException ex = assertThrows(AppException.class, () -> flashcardService.getCardsForReview(10L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }
    }

    // =============================================
    // XÓA THẺ GHI NHỚ
    // =============================================
    @Nested
    @DisplayName("removeCard - Xóa thẻ ghi nhớ")
    class RemoveCardTests {

        @Test
        @DisplayName("Xóa thẻ thành công")
        void shouldRemoveCardSuccessfully() {
            Flashcard card = Flashcard.builder().id(1L).studyDeck(mockDeck).build();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));

            flashcardService.removeCard(1L);

            verify(flashcardRepository).delete(card);
        }

        @Test
        @DisplayName("Từ chối xóa khi thẻ không tồn tại")
        void shouldRejectDeleteWhenCardNotFound() {
            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(999L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class, () -> flashcardService.removeCard(999L));
            assertEquals(ErrorCode.CARD_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Từ chối xóa khi người dùng không sở hữu thẻ")
        void shouldRejectDeleteWhenUserDoesNotOwnCard() {
            Users otherUser = new Users();
            otherUser.setId(99L);
            StudyDeck otherDeck = StudyDeck.builder().id(20L).user(otherUser).build();
            Flashcard card = Flashcard.builder().id(1L).studyDeck(otherDeck).build();

            when(securityUtil.getCurrentUser()).thenReturn(mockUser);
            when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));

            AppException ex = assertThrows(AppException.class, () -> flashcardService.removeCard(1L));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
            verify(flashcardRepository, never()).delete(any(Flashcard.class));
        }
    }
}
