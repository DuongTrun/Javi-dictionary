/**
 * File này: Unit Tests cho FlashcardController.
 * Vai trò: Kiểm thử các API endpoints của module Flashcard (thêm thẻ, lấy thẻ ôn tập, gửi kết quả ôn tập, lấy thẻ theo sổ tay, xóa thẻ).
 * Dùng khi: Chạy bộ kiểm thử tự động để đảm bảo API trả đúng HTTP Status, JSON structure và message.
 */
package com.example.javi.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import com.example.javi.dto.request.FlashcardRequest;
import com.example.javi.dto.request.FlashcardReviewRequest;
import com.example.javi.dto.response.FlashcardResponse;
import com.example.javi.dto.response.VocabResponse;
import com.example.javi.repository.TokenRepository;
import com.example.javi.service.FlashcardService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = FlashcardController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("FlashcardController - Unit Tests")
class FlashcardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FlashcardService flashcardService;

    @MockBean
    private TokenRepository tokenRepository;

    @MockBean
    private JwtDecoder jwtDecoder;

    // =============================================
    // POST /api/v1/flashcards - Thêm thẻ ghi nhớ
    // =============================================
    @Test
    @DisplayName("POST /api/v1/flashcards - Thêm thẻ từ vựng thành công, JSON response chứa trường 'vocab' (không phải 'vocabulary')")
    void shouldAddVocabCardAndReturnVocabField() throws Exception {
        VocabResponse vocabResponse = VocabResponse.builder()
                .id(100L)
                .word("食べる")
                .hiragana("たべる")
                .build();

        FlashcardResponse response = FlashcardResponse.builder()
                .id(1L)
                .deckId(10L)
                .vocab(vocabResponse)
                .repetitions(0)
                .easeFactor(2.5)
                .intervalDays(0)
                .nextReviewDate(LocalDate.now())
                .build();

        when(flashcardService.addCardToDeck(any(FlashcardRequest.class))).thenReturn(response);

        FlashcardRequest request = FlashcardRequest.builder()
                .deckId(10L)
                .vocabId(100L)
                .build();

        mockMvc.perform(post("/api/v1/flashcards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đã lưu thẻ vào sổ tay học tập"))
                .andExpect(jsonPath("$.result.id").value(1))
                .andExpect(jsonPath("$.result.deckId").value(10))
                // Kiểm tra trường "vocab" (KHÔNG phải "vocabulary") đúng như Frontend mong đợi
                .andExpect(jsonPath("$.result.vocab.word").value("食べる"))
                .andExpect(jsonPath("$.result.vocab.hiragana").value("たべる"))
                .andExpect(jsonPath("$.result.vocab.id").value(100));

        verify(flashcardService).addCardToDeck(any(FlashcardRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/flashcards - Thêm thẻ tùy chỉnh (frontText/backText)")
    void shouldAddCustomCard() throws Exception {
        FlashcardResponse response = FlashcardResponse.builder()
                .id(2L)
                .deckId(10L)
                .frontText("ありがとう")
                .backText("Cảm ơn")
                .repetitions(0)
                .easeFactor(2.5)
                .intervalDays(0)
                .nextReviewDate(LocalDate.now())
                .build();

        when(flashcardService.addCardToDeck(any(FlashcardRequest.class))).thenReturn(response);

        FlashcardRequest request = FlashcardRequest.builder()
                .deckId(10L)
                .frontText("ありがとう")
                .backText("Cảm ơn")
                .build();

        mockMvc.perform(post("/api/v1/flashcards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.frontText").value("ありがとう"))
                .andExpect(jsonPath("$.result.backText").value("Cảm ơn"))
                .andExpect(jsonPath("$.result.vocab").doesNotExist());
    }

    // =============================================
    // GET /api/v1/flashcards/review/{deckId}
    // =============================================
    @Test
    @DisplayName("GET /api/v1/flashcards/review/{deckId} - Lấy danh sách thẻ cần ôn tập hôm nay")
    void shouldGetCardsForReview() throws Exception {
        FlashcardResponse card1 = FlashcardResponse.builder()
                .id(1L).deckId(10L).repetitions(0).easeFactor(2.5).intervalDays(0)
                .nextReviewDate(LocalDate.now()).build();
        FlashcardResponse card2 = FlashcardResponse.builder()
                .id(2L).deckId(10L).repetitions(1).easeFactor(2.5).intervalDays(1)
                .nextReviewDate(LocalDate.now()).build();

        when(flashcardService.getCardsForReview(10L)).thenReturn(List.of(card1, card2));

        mockMvc.perform(get("/api/v1/flashcards/review/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result.length()").value(2))
                .andExpect(jsonPath("$.result[0].id").value(1))
                .andExpect(jsonPath("$.result[1].id").value(2));

        verify(flashcardService).getCardsForReview(10L);
    }

    @Test
    @DisplayName("GET /api/v1/flashcards/review/{deckId} - Trả danh sách rỗng khi không có thẻ cần ôn")
    void shouldReturnEmptyReviewList() throws Exception {
        when(flashcardService.getCardsForReview(10L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/flashcards/review/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result.length()").value(0));
    }

    // =============================================
    // POST /api/v1/flashcards/review - Gửi kết quả ôn tập
    // =============================================
    @Test
    @DisplayName("POST /api/v1/flashcards/review - Gửi kết quả ôn tập SM-2 thành công")
    void shouldSubmitReviewSuccessfully() throws Exception {
        FlashcardResponse response = FlashcardResponse.builder()
                .id(1L)
                .deckId(10L)
                .repetitions(1)
                .easeFactor(2.6)
                .intervalDays(1)
                .nextReviewDate(LocalDate.now().plusDays(1))
                .lastReviewDate(LocalDate.now())
                .build();

        when(flashcardService.submitReview(any(FlashcardReviewRequest.class))).thenReturn(response);

        FlashcardReviewRequest request = FlashcardReviewRequest.builder()
                .cardId(1L)
                .rating(3) // Good
                .build();

        mockMvc.perform(post("/api/v1/flashcards/review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đã cập nhật lịch ôn tập của thẻ"))
                .andExpect(jsonPath("$.result.repetitions").value(1))
                .andExpect(jsonPath("$.result.intervalDays").value(1))
                .andExpect(jsonPath("$.result.lastReviewDate").exists());

        verify(flashcardService).submitReview(any(FlashcardReviewRequest.class));
    }

    // =============================================
    // GET /api/v1/flashcards/deck/{deckId}
    // =============================================
    @Test
    @DisplayName("GET /api/v1/flashcards/deck/{deckId} - Lấy toàn bộ thẻ trong sổ tay")
    void shouldGetCardsByDeckId() throws Exception {
        FlashcardResponse card = FlashcardResponse.builder()
                .id(1L).deckId(10L).frontText("テスト").backText("Kiểm thử")
                .repetitions(0).easeFactor(2.5).intervalDays(0).nextReviewDate(LocalDate.now()).build();

        when(flashcardService.getCardsByDeckId(10L)).thenReturn(List.of(card));

        mockMvc.perform(get("/api/v1/flashcards/deck/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.length()").value(1))
                .andExpect(jsonPath("$.result[0].frontText").value("テスト"));
    }

    // =============================================
    // DELETE /api/v1/flashcards/{id}
    // =============================================
    @Test
    @DisplayName("DELETE /api/v1/flashcards/{id} - Xóa thẻ ghi nhớ thành công")
    void shouldDeleteCardSuccessfully() throws Exception {
        doNothing().when(flashcardService).removeCard(1L);

        mockMvc.perform(delete("/api/v1/flashcards/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Xóa thẻ ghi nhớ thành công"));

        verify(flashcardService).removeCard(1L);
    }
}
