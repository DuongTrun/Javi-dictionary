package com.example.javi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import reactor.core.publisher.Flux;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.entity.AccountType;
import com.example.javi.entity.EngineType;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.Impl.GeminiServiceImpl;
import com.example.javi.utils.SecurityUtil;

@ExtendWith(MockitoExtension.class)
@DisplayName("GeminiServiceImpl - Unit Tests")
class GeminiServiceImplTest {

    @Mock ChatClient.Builder chatClientBuilder;
    @Mock(answer = Answers.RETURNS_DEEP_STUBS) ChatClient chatClient;
    @Mock SecurityUtil securityUtil;
    @Mock TranslationMapper translationMapper;
    @Mock TranslationRepository translationRepository;
    @Mock OcrService ocrService;
    @Mock UsersService usersService;

    private GeminiServiceImpl geminiService;
    private Users mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new Users();
        mockUser.setId(1L);
        mockUser.setEmail("test@javi.com");
        mockUser.setAccountType(AccountType.FREE);

        when(chatClientBuilder.build()).thenReturn(chatClient);
        geminiService = new GeminiServiceImpl(
                chatClientBuilder,
                securityUtil,
                translationMapper,
                translationRepository,
                ocrService,
                usersService,
                null
        );
    }

    @Test
    @DisplayName("streamTranslateText - Stream kết quả dịch từ Gemini và lưu vào DB")
    void shouldStreamTranslationAndSaveToDb() {
        // Arrange
        TranslateRequest request = new TranslateRequest();
        request.setSourceText("こんにちは");
        request.setSourceLang("ja");
        request.setTargetLang("vi");
        request.setEngine("AI");

        String chunk1 = "Xin ";
        String chunk2 = "chào";

        when(securityUtil.getCurrentUser()).thenReturn(mockUser);

        // Mock ChatClient fluid interface using deep stubs
        when(chatClient.prompt().user(anyString()).stream().content()).thenReturn(Flux.just(chunk1, chunk2));


        Translation mockTranslation = new Translation();
        when(translationMapper.toTranslation(request)).thenReturn(mockTranslation);

        // Act
        List<String> result = geminiService.streamTranslateText(request).collectList().block();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(chunk1, result.get(0));
        assertEquals(chunk2, result.get(1));

        verify(translationRepository).save(mockTranslation);
        assertEquals("Xin chào", mockTranslation.getTranslatedText());
        assertEquals(EngineType.AI, mockTranslation.getEngine());
        assertEquals(mockUser, mockTranslation.getUser());
    }
}
