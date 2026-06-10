package com.example.javi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;

import com.example.javi.entity.AccountType;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.VocabulariesMapper;
import com.example.javi.repository.VocabulariesRepository;
import com.example.javi.service.Impl.VocabulariesServiceImpl;
import com.example.javi.service.cache.RedisHelper;
import com.example.javi.service.cache.VocabulariesCacheService;
import com.example.javi.utils.SecurityUtil;

@ExtendWith(MockitoExtension.class)
@DisplayName("VocabulariesServiceImpl - Unit Tests")
class VocabulariesServiceImplTest {

    @Mock VocabulariesRepository vocabulariesRepository;
    @Mock VocabulariesMapper vocabulariesMapper;
    @Mock SecurityUtil securityUtil;
    @Mock UsersService usersService;
    @Mock RedisHelper redisHelper;
    @Mock VocabulariesCacheService vocabulariesCacheService;
    @Mock GeminiService geminiService;

    @InjectMocks
    VocabulariesServiceImpl vocabulariesService;

    private Users mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new Users();
        mockUser.setId(1L);
        mockUser.setEmail("test@javi.com");
        mockUser.setAccountType(AccountType.FREE);
    }

    @Test
    @DisplayName("streamExplainVocabulary - Trả về cache khi đã tồn tại trong Redis")
    void shouldReturnCachedExplanation() {
        // Arrange
        String word = "飲む";
        String cachedExplanation = "Giải nghĩa từ 飲む";

        when(securityUtil.getCurrentUser()).thenReturn(mockUser);
        when(redisHelper.find(anyString(), eq(String.class))).thenReturn(null); // Anti-spam check: null means not spamming
        when(vocabulariesCacheService.getExplain(word)).thenReturn(cachedExplanation);

        // Act
        java.util.List<String> result = vocabulariesService.streamExplainVocabulary(word).collectList().block();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(cachedExplanation, result.get(0));

        verify(geminiService, never()).streamExplainWord(anyString());
        verify(vocabulariesCacheService, never()).saveExplain(anyString(), anyString());
    }

    @Test
    @DisplayName("streamExplainVocabulary - Gọi Gemini stream và lưu cache khi chưa có cache")
    void shouldStreamFromGeminiAndSaveCache() {
        // Arrange
        String word = "飲む";
        String chunk1 = "Giải ";
        String chunk2 = "nghĩa từ 飲む";

        when(securityUtil.getCurrentUser()).thenReturn(mockUser);
        when(redisHelper.find(anyString(), eq(String.class))).thenReturn(null);
        when(vocabulariesCacheService.getExplain(word)).thenReturn(null);
        when(geminiService.streamExplainWord(word)).thenReturn(Flux.just(chunk1, chunk2));

        // Act
        java.util.List<String> result = vocabulariesService.streamExplainVocabulary(word).collectList().block();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(chunk1, result.get(0));
        assertEquals(chunk2, result.get(1));

        verify(vocabulariesCacheService).saveExplain(word, "Giải nghĩa từ 飲む");
    }
}

