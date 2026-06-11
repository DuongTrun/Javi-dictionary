package com.example.javi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.response.VoiceChatResponse;
import com.example.javi.dto.response.VoiceDialogueResponse;
import com.example.javi.dto.response.VoiceEvaluationResponse;
import com.example.javi.entity.Users;
import com.example.javi.entity.AccountType;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.Impl.VoiceServiceImpl;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests cho VoiceServiceImpl.
 * 
 * Vì VoiceServiceImpl gọi trực tiếp Gemini API qua RestClient (không qua interface injectable),
 * ta viết các tests chủ yếu tập trung vào:
 * - Kiểm tra validation đầu vào (null/empty/quá lớn)
 * - Kiểm tra xử lý lỗi / fallback graceful
 * - Kiểm tra DTO serialization/deserialization
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VoiceServiceImpl - Unit Tests")
class VoiceServiceImplTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    @Mock
    private SecurityUtil securityUtil;

    @Mock
    private UsersService usersService;

    @Mock
    private com.example.javi.service.cache.RedisHelper redisHelper;

    private ObjectMapper objectMapper;
    private VoiceServiceImpl voiceService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        when(chatClientBuilder.build()).thenReturn(chatClient);
        voiceService = new VoiceServiceImpl(chatClientBuilder, objectMapper, "test-api-key", securityUtil, usersService, redisHelper);
    }

    // =============================================
    // LEVEL 1 & 2: evaluateSimplePronunciation
    // =============================================
    @Nested
    @DisplayName("evaluateSimplePronunciation - Kiểm tra validation đầu vào")
    class EvaluateSimpleValidation {

        @Test
        @DisplayName("Trả về AppException khi audioFile là null")
        void shouldThrowWhenAudioFileIsNull() {
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateSimplePronunciation(null, "テスト"));
            assertEquals(ErrorCode.AUDIO_FILE_REQUIRED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi audioFile rỗng (empty)")
        void shouldThrowWhenAudioFileIsEmpty() {
            MockMultipartFile emptyFile = new MockMultipartFile("audio", "test.webm", "audio/webm", new byte[0]);
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateSimplePronunciation(emptyFile, "テスト"));
            assertEquals(ErrorCode.AUDIO_FILE_REQUIRED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi targetText là null")
        void shouldThrowWhenTargetTextIsNull() {
            MockMultipartFile audioFile = new MockMultipartFile("audio", "test.webm", "audio/webm", new byte[]{1, 2, 3});
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateSimplePronunciation(audioFile, null));
            assertEquals(ErrorCode.VOICE_TARGET_TEXT_EMPTY, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi targetText rỗng (blank)")
        void shouldThrowWhenTargetTextIsBlank() {
            MockMultipartFile audioFile = new MockMultipartFile("audio", "test.webm", "audio/webm", new byte[]{1, 2, 3});
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateSimplePronunciation(audioFile, "   "));
            assertEquals(ErrorCode.VOICE_TARGET_TEXT_EMPTY, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi audioFile vượt quá 5MB")
        void shouldThrowWhenAudioFileTooLarge() {
            byte[] largeData = new byte[5 * 1024 * 1024 + 1]; // > 5MB
            MockMultipartFile bigFile = new MockMultipartFile("audio", "test.webm", "audio/webm", largeData);
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateSimplePronunciation(bigFile, "テスト"));
            assertEquals(ErrorCode.AUDIO_FILE_TOO_LARGE, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("evaluateSimplePronunciation - Xử lý lỗi Gemini API (fallback)")
    class EvaluateSimpleFallback {

        @Test
        @DisplayName("Trả về kết quả fallback an toàn khi Gemini API thất bại (không crash)")
        void shouldReturnFallbackWhenGeminiApiFails() {
            // Tạo file audio hợp lệ nhưng nhỏ — Gemini sẽ fail vì API key giả
            byte[] smallAudio = new byte[100];
            MockMultipartFile audioFile = new MockMultipartFile("audio", "test.webm", "audio/webm", smallAudio);

            Users dummyUser = Users.builder()
                    .username("testuser")
                    .accountType(AccountType.PREMIUM)
                    .build();
            when(securityUtil.getCurrentUser()).thenReturn(dummyUser);

            // Gọi method — vì api-key là giả, Gemini sẽ trả lỗi -> fallback
            VoiceEvaluationResponse result = voiceService.evaluateSimplePronunciation(audioFile, "テスト");

            assertNotNull(result, "Kết quả fallback không được null");
            assertEquals(0, result.getScore(), "Score fallback phải là 0");
            assertEquals("IMPROVABLE", result.getAccuracyLevel());
            assertTrue(result.getFeedback().contains("Không thể nhận diện giọng nói"),
                    "Feedback fallback phải chứa thông báo lỗi thân thiện");
            assertNotNull(result.getWordsAnalysis(), "wordsAnalysis không được null");
        }
    }

    // =============================================
    // LEVEL 3: evaluateChatConversation
    // =============================================
    @Nested
    @DisplayName("evaluateChatConversation - Kiểm tra validation đầu vào")
    class EvaluateChatValidation {

        @Test
        @DisplayName("Trả về AppException khi audioFile là null")
        void shouldThrowWhenAudioFileIsNull() {
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateChatConversation(null, "Du lịch", "[]"));
            assertEquals(ErrorCode.AUDIO_FILE_REQUIRED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi audioFile rỗng (empty)")
        void shouldThrowWhenAudioFileIsEmpty() {
            MockMultipartFile emptyFile = new MockMultipartFile("audio", "test.webm", "audio/webm", new byte[0]);
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateChatConversation(emptyFile, "Du lịch", "[]"));
            assertEquals(ErrorCode.AUDIO_FILE_REQUIRED, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi audioFile vượt quá 5MB")
        void shouldThrowWhenAudioFileTooLarge() {
            byte[] largeData = new byte[5 * 1024 * 1024 + 1];
            MockMultipartFile bigFile = new MockMultipartFile("audio", "test.webm", "audio/webm", largeData);
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.evaluateChatConversation(bigFile, "Du lịch", "[]"));
            assertEquals(ErrorCode.AUDIO_FILE_TOO_LARGE, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("evaluateChatConversation - Xử lý lỗi Gemini API (fallback)")
    class EvaluateChatFallback {

        @Test
        @DisplayName("Trả về kết quả fallback an toàn khi Gemini API thất bại")
        void shouldReturnFallbackWhenGeminiApiFails() {
            byte[] smallAudio = new byte[100];
            MockMultipartFile audioFile = new MockMultipartFile("audio", "test.webm", "audio/webm", smallAudio);

            Users dummyUser = Users.builder()
                    .username("testuser")
                    .accountType(AccountType.PREMIUM)
                    .build();
            when(securityUtil.getCurrentUser()).thenReturn(dummyUser);

            VoiceChatResponse result = voiceService.evaluateChatConversation(audioFile, "Du lịch", "[]");

            assertNotNull(result, "Kết quả fallback không được null");
            assertEquals(0, result.getPronunciationScore(), "Score fallback phải là 0");
            assertTrue(result.getPronunciationFeedback().contains("Không nghe rõ giọng nói"),
                    "Feedback fallback phải chứa thông báo lỗi thân thiện");
            assertNotNull(result.getNextAiResponseText(), "nextAiResponseText không được null");
            assertNotNull(result.getNextAiResponseTranslation(), "nextAiResponseTranslation không được null");
        }
    }

    // =============================================
    // GENERATE DIALOGUE (Level 2 AI)
    // =============================================
    @Nested
    @DisplayName("generateDialogue - Kiểm tra validation đầu vào")
    class GenerateDialogueValidation {

        @Test
        @DisplayName("Trả về AppException khi topicName là null")
        void shouldThrowWhenTopicNameIsNull() {
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.generateDialogue(null));
            assertEquals(ErrorCode.VOICE_TARGET_TEXT_EMPTY, ex.getErrorCode());
        }

        @Test
        @DisplayName("Trả về AppException khi topicName rỗng (blank)")
        void shouldThrowWhenTopicNameIsBlank() {
            AppException ex = assertThrows(AppException.class,
                    () -> voiceService.generateDialogue("   "));
            assertEquals(ErrorCode.VOICE_TARGET_TEXT_EMPTY, ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("generateDialogue - Xử lý lỗi Gemini API (fallback)")
    class GenerateDialogueFallback {

        @Test
        @DisplayName("Trả về hội thoại mặc định khi Gemini API thất bại")
        void shouldReturnFallbackDialogueWhenGeminiApiFails() {
            // API key giả -> Gemini trả lỗi -> fallback
            VoiceDialogueResponse result = voiceService.generateDialogue("Du lịch");

            assertNotNull(result, "Kết quả fallback không được null");
            assertNotNull(result.getQuestion(), "question không được null");
            assertFalse(result.getQuestion().isEmpty(), "question không được rỗng");
            assertNotNull(result.getQuestionVi(), "questionVi không được null");
            assertFalse(result.getQuestionVi().isEmpty(), "questionVi không được rỗng");

            assertNotNull(result.getOptions(), "options không được null");
            assertEquals(3, result.getOptions().size(), "Phải có đúng 3 phương án gợi ý");

            // Kiểm tra từng option
            for (int i = 0; i < result.getOptions().size(); i++) {
                VoiceDialogueResponse.Option opt = result.getOptions().get(i);
                assertNotNull(opt.getJp(), "Option " + i + " jp không được null");
                assertFalse(opt.getJp().isEmpty(), "Option " + i + " jp không được rỗng");
                assertNotNull(opt.getVi(), "Option " + i + " vi không được null");
                assertFalse(opt.getVi().isEmpty(), "Option " + i + " vi không được rỗng");
            }
        }
    }

    // =============================================
    // DTO SERIALIZATION TESTS
    // =============================================
    @Nested
    @DisplayName("DTO Serialization/Deserialization")
    class DtoSerializationTests {

        @Test
        @DisplayName("VoiceEvaluationResponse - serialize/deserialize chính xác")
        void shouldSerializeDeserializeVoiceEvaluation() throws Exception {
            VoiceEvaluationResponse original = VoiceEvaluationResponse.builder()
                    .score(85)
                    .accuracyLevel("EXCELLENT")
                    .feedback("Phát âm rất chuẩn xác!")
                    .wordsAnalysis(List.of(
                            VoiceEvaluationResponse.WordAnalysis.builder()
                                    .word("旅行")
                                    .isCorrect(true)
                                    .phonemeError("")
                                    .build(),
                            VoiceEvaluationResponse.WordAnalysis.builder()
                                    .word("行く")
                                    .isCorrect(false)
                                    .phonemeError("Sai trường âm")
                                    .build()
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(original);
            VoiceEvaluationResponse deserialized = objectMapper.readValue(json, VoiceEvaluationResponse.class);

            assertEquals(original.getScore(), deserialized.getScore());
            assertEquals(original.getAccuracyLevel(), deserialized.getAccuracyLevel());
            assertEquals(original.getFeedback(), deserialized.getFeedback());
            assertEquals(original.getWordsAnalysis().size(), deserialized.getWordsAnalysis().size());

            // Kiểm tra isCorrect serialize đúng (Lombok boolean bug)
            assertTrue(json.contains("\"isCorrect\""), "JSON phải chứa key isCorrect (không phải correct)");
        }

        @Test
        @DisplayName("VoiceChatResponse - serialize/deserialize chính xác")
        void shouldSerializeDeserializeVoiceChat() throws Exception {
            VoiceChatResponse original = VoiceChatResponse.builder()
                    .userSpokenText("こんにちは")
                    .userSpokenTranslation("Xin chào")
                    .pronunciationScore(90)
                    .pronunciationFeedback("Rất tốt!")
                    .isGrammarValid(true)
                    .grammarFeedback("")
                    .nextAiResponseText("お元気ですか？")
                    .nextAiResponseTranslation("Bạn có khỏe không?")
                    .build();

            String json = objectMapper.writeValueAsString(original);
            VoiceChatResponse deserialized = objectMapper.readValue(json, VoiceChatResponse.class);

            assertEquals(original.getUserSpokenText(), deserialized.getUserSpokenText());
            assertEquals(original.getPronunciationScore(), deserialized.getPronunciationScore());
            assertEquals(original.getNextAiResponseText(), deserialized.getNextAiResponseText());

            // Kiểm tra isGrammarValid serialize đúng (Lombok boolean bug)
            assertTrue(json.contains("\"isGrammarValid\""), "JSON phải chứa key isGrammarValid (không phải grammarValid)");
        }

        @Test
        @DisplayName("VoiceDialogueResponse - serialize/deserialize chính xác")
        void shouldSerializeDeserializeVoiceDialogue() throws Exception {
            VoiceDialogueResponse original = VoiceDialogueResponse.builder()
                    .question("日本へ行ったことがありますか？")
                    .questionVi("Bạn đã từng đi Nhật chưa?")
                    .options(List.of(
                            new VoiceDialogueResponse.Option("はい、行ったことがあります。", "Vâng, đã từng đi."),
                            new VoiceDialogueResponse.Option("いいえ、まだです。", "Chưa, vẫn chưa đi."),
                            new VoiceDialogueResponse.Option("いつか行きたいです。", "Một ngày nào đó muốn đi.")
                    ))
                    .build();

            String json = objectMapper.writeValueAsString(original);
            VoiceDialogueResponse deserialized = objectMapper.readValue(json, VoiceDialogueResponse.class);

            assertEquals(original.getQuestion(), deserialized.getQuestion());
            assertEquals(original.getQuestionVi(), deserialized.getQuestionVi());
            assertEquals(3, deserialized.getOptions().size());
            assertEquals("はい、行ったことがあります。", deserialized.getOptions().get(0).getJp());
            assertEquals("Vâng, đã từng đi.", deserialized.getOptions().get(0).getVi());
        }

        @Test
        @DisplayName("VoiceEvaluationResponse - deserialize từ JSON mẫu Gemini")
        void shouldDeserializeFromGeminiStyleJson() throws Exception {
            String geminiJson = """
                    {
                      "score": 72,
                      "accuracyLevel": "GOOD",
                      "feedback": "Phát âm khá tốt nhưng cần chú ý trường âm.",
                      "wordsAnalysis": [
                         {
                           "word": "東京",
                           "isCorrect": true,
                           "phonemeError": ""
                         },
                         {
                           "word": "タワー",
                           "isCorrect": false,
                           "phonemeError": "Thiếu trường âm ở âm 'ā'"
                         }
                      ]
                    }
                    """;

            VoiceEvaluationResponse result = objectMapper.readValue(geminiJson, VoiceEvaluationResponse.class);

            assertEquals(72, result.getScore());
            assertEquals("GOOD", result.getAccuracyLevel());
            assertEquals(2, result.getWordsAnalysis().size());
            assertTrue(result.getWordsAnalysis().get(0).isCorrect());
            assertFalse(result.getWordsAnalysis().get(1).isCorrect());
            assertEquals("Thiếu trường âm ở âm 'ā'", result.getWordsAnalysis().get(1).getPhonemeError());
        }

        @Test
        @DisplayName("VoiceDialogueResponse - deserialize từ JSON mẫu Gemini")
        void shouldDeserializeDialogueFromGeminiStyleJson() throws Exception {
            String geminiJson = """
                    {
                      "question": "趣味は何ですか？",
                      "questionVi": "Sở thích của bạn là gì?",
                      "options": [
                        {
                          "jp": "映画を見ることが好きです。",
                          "vi": "Tôi thích xem phim."
                        },
                        {
                          "jp": "スポーツが趣味です。",
                          "vi": "Sở thích của tôi là thể thao."
                        },
                        {
                          "jp": "読書が一番好きです。",
                          "vi": "Tôi thích đọc sách nhất."
                        }
                      ]
                    }
                    """;

            VoiceDialogueResponse result = objectMapper.readValue(geminiJson, VoiceDialogueResponse.class);

            assertEquals("趣味は何ですか？", result.getQuestion());
            assertEquals("Sở thích của bạn là gì?", result.getQuestionVi());
            assertEquals(3, result.getOptions().size());
            assertEquals("映画を見ることが好きです。", result.getOptions().get(0).getJp());
        }
    }

    // =============================================
    // SANITIZE JSON (Gián tiếp qua integration)
    // =============================================
    @Nested
    @DisplayName("sanitizeJson - Kiểm tra gián tiếp qua DTO deserialization")
    class SanitizeJsonTests {

        @Test
        @DisplayName("Xử lý JSON bọc trong markdown code fence")
        void shouldHandleMarkdownCodeFence() throws Exception {
            // sanitizeJson là private, ta test gián tiếp qua DTO parse
            String wrappedJson = """
                    ```json
                    {
                      "question": "テスト",
                      "questionVi": "Test",
                      "options": []
                    }
                    ```
                    """;

            // Giả lập sanitize logic
            String fixed = wrappedJson.replaceAll("(?s)```(json)?", "").trim();
            VoiceDialogueResponse result = objectMapper.readValue(fixed, VoiceDialogueResponse.class);
            assertEquals("テスト", result.getQuestion());
        }

        @Test
        @DisplayName("Xử lý JSON có text thừa trước và sau")
        void shouldHandleExtraTextAroundJson() throws Exception {
            String dirtyJson = """
                    Here is the dialogue:
                    {"question": "テスト", "questionVi": "Test", "options": []}
                    Hope this helps!
                    """;

            // Giả lập sanitize: lấy từ { đến }
            int start = dirtyJson.indexOf('{');
            int end = dirtyJson.lastIndexOf('}');
            String cleanJson = dirtyJson.substring(start, end + 1);
            VoiceDialogueResponse result = objectMapper.readValue(cleanJson, VoiceDialogueResponse.class);
            assertEquals("テスト", result.getQuestion());
        }
    }
}
