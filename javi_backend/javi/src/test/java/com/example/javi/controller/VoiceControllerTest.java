package com.example.javi.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import com.example.javi.dto.response.VoiceChatResponse;
import com.example.javi.dto.response.VoiceDialogueResponse;
import com.example.javi.dto.response.VoiceEvaluationResponse;
import com.example.javi.repository.TokenRepository;
import com.example.javi.service.VoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = VoiceController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("VoiceController - Unit Tests")
class VoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VoiceService voiceService;

    @MockBean
    private TokenRepository tokenRepository;

    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("POST /api/v1/voice/evaluate - Đánh giá phát âm thành công")
    void shouldEvaluatePronunciation() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test.webm", MediaType.MULTIPART_FORM_DATA_VALUE, new byte[]{1, 2, 3});

        VoiceEvaluationResponse response = VoiceEvaluationResponse.builder()
                .score(90)
                .accuracyLevel("EXCELLENT")
                .feedback("Phát âm rất tốt")
                .wordsAnalysis(List.of())
                .build();

        when(voiceService.evaluateSimplePronunciation(any(), anyString())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/voice/evaluate")
                .file(audioFile)
                .param("targetText", "こんにちは"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đánh giá phát âm thành công"))
                .andExpect(jsonPath("$.result.score").value(90))
                .andExpect(jsonPath("$.result.accuracyLevel").value("EXCELLENT"));

        verify(voiceService, times(1)).evaluateSimplePronunciation(any(), eq("こんにちは"));
    }

    @Test
    @DisplayName("POST /api/v1/voice/chat - Phản hồi hội thoại thành công")
    void shouldEvaluateChat() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test.webm", MediaType.MULTIPART_FORM_DATA_VALUE, new byte[]{1, 2, 3});

        VoiceChatResponse response = VoiceChatResponse.builder()
                .userSpokenText("こんにちは")
                .userSpokenTranslation("Xin chào")
                .pronunciationScore(85)
                .pronunciationFeedback("Khá tốt")
                .isGrammarValid(true)
                .grammarFeedback("")
                .nextAiResponseText("お元気ですか？")
                .nextAiResponseTranslation("Bạn có khỏe không?")
                .build();

        when(voiceService.evaluateChatConversation(any(), anyString(), anyString())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/voice/chat")
                .file(audioFile)
                .param("topicName", "Du lịch")
                .param("historyJson", "[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Phản hồi hội thoại thành công"))
                .andExpect(jsonPath("$.result.pronunciationScore").value(85))
                .andExpect(jsonPath("$.result.nextAiResponseText").value("お元気ですか？"));

        verify(voiceService, times(1)).evaluateChatConversation(any(), eq("Du lịch"), eq("[]"));
    }

    @Test
    @DisplayName("GET /api/v1/voice/generate-dialogue - Tạo câu hỏi hội thoại thành công")
    void shouldGenerateDialogue() throws Exception {
        VoiceDialogueResponse response = VoiceDialogueResponse.builder()
                .question("趣味は何ですか？")
                .questionVi("Sở thích của bạn là gì?")
                .options(List.of(
                        new VoiceDialogueResponse.Option("映画を見ることです。", "Xem phim."),
                        new VoiceDialogueResponse.Option("本を読むことです。", "Đọc sách.")
                ))
                .build();

        when(voiceService.generateDialogue(anyString())).thenReturn(response);

        mockMvc.perform(get("/api/v1/voice/generate-dialogue")
                .param("topicName", "Sở thích"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tạo câu hỏi hội thoại thành công"))
                .andExpect(jsonPath("$.result.question").value("趣味は何ですか？"))
                .andExpect(jsonPath("$.result.options[0].jp").value("映画を見ることです。"));

        verify(voiceService, times(1)).generateDialogue(eq("Sở thích"));
    }
}
