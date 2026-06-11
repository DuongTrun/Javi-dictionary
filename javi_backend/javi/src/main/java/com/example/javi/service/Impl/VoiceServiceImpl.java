package com.example.javi.service.Impl;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Base64;
import java.time.Duration;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.response.VoiceChatResponse;
import com.example.javi.dto.response.VoiceEvaluationResponse;
import com.example.javi.dto.response.VoiceDialogueResponse;
import com.example.javi.entity.AccountType;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.UsersService;
import com.example.javi.service.VoiceService;
import com.example.javi.utils.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import com.example.javi.service.cache.RedisHelper;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VoiceServiceImpl implements VoiceService {

    ChatClient chatClient;
    ObjectMapper objectMapper;
    String apiKey;
    SecurityUtil securityUtil;
    UsersService usersService;
    RestClient restClient;
    RedisHelper redisHelper;

    public VoiceServiceImpl(
            ChatClient.Builder builder, 
            ObjectMapper objectMapper, 
            @Value("${spring.ai.openai.api-key}") String apiKey,
            SecurityUtil securityUtil,
            UsersService usersService,
            RedisHelper redisHelper) {
        this.chatClient = builder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.securityUtil = securityUtil;
        this.usersService = usersService;
        this.redisHelper = redisHelper;

        // Pooled JDK HTTP Client — timeout thấp để fail-fast, tránh treo UX
        java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        org.springframework.http.client.JdkClientHttpRequestFactory requestFactory = 
                new org.springframework.http.client.JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(20000); // 20s read timeout

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=";

    // ===== Prompt templates (static để tránh tạo lại mỗi request) =====
    private static final String PRONUNCIATION_PROMPT_TEMPLATE =
            """
            Bạn là chuyên gia huấn luyện phát âm tiếng Nhật cho người Việt.
            Lắng nghe audio, so sánh với mẫu: "%s".
            Phân tích lỗi phát âm (trường âm, âm ngắt っ, phụ/nguyên âm).
            Trả về CHỈ JSON (không markdown):
            {"score":85,"accuracyLevel":"GOOD","feedback":"nhận xét tiếng Việt","wordsAnalysis":[{"word":"từ mẫu","isCorrect":true,"phonemeError":""}]}
            """;

    private static final String KAIWA_PROMPT_TEMPLATE =
            """
            Bạn là Kaiwa Partner luyện hội thoại tiếng Nhật kiêm giáo viên chấm điểm.
            Chủ đề: "%s". Lịch sử: %s
            Nhiệm vụ: 1.Nhận diện STT 2.Dịch Việt 3.Chấm phát âm 0-100 4.Kiểm tra ngữ pháp 5.Đáp lại bằng tiếng Nhật (<25 từ).
            Trả về CHỈ JSON (không markdown):
            {"userSpokenText":"","userSpokenTranslation":"","pronunciationScore":85,"pronunciationFeedback":"","isGrammarValid":true,"grammarFeedback":"","nextAiResponseText":"","nextAiResponseTranslation":""}
            """;

    private static final String DIALOGUE_PROMPT_TEMPLATE =
            """
            Bạn là trợ lý AI thiết kế tình huống giao tiếp tiếng Nhật.
            Chủ đề: %s. Tạo 1 câu hỏi + 3 phương án trả lời (khẳng định/phủ định/mở rộng), trình độ sơ trung cấp.
            Trả về CHỈ JSON (không markdown):
            {"question":"","questionVi":"","options":[{"jp":"","vi":""},{"jp":"","vi":""},{"jp":"","vi":""}]}
            """;

    /**
     * Gọi Gemini REST API với audio inlineData.
     * Tự động retry 1 lần nếu gặp lỗi 503 (server overloaded).
     */
    private String callGeminiDirect(byte[] audioBytes, MimeType mimeType, String systemInstruction) throws Exception {
        String url = GEMINI_API_URL + apiKey;
        String audioBase64 = Base64.getEncoder().encodeToString(audioBytes);

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "parts", List.of(
                        Map.of("inlineData", Map.of(
                            "mimeType", mimeType.toString(),
                            "data", audioBase64
                        ))
                    )
                )
            ),
            "systemInstruction", Map.of(
                "parts", List.of(
                    Map.of("text", systemInstruction)
                )
            )
        );

        String responseJson = executeWithRetry(url, requestBody);
        return extractTextFromResponse(responseJson);
    }

    /**
     * Gọi Gemini REST API với text-only prompt.
     * Tự động retry 1 lần nếu gặp lỗi 503.
     */
    private String callGeminiTextDirect(String systemInstruction, String promptText) throws Exception {
        String url = GEMINI_API_URL + apiKey;

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "parts", List.of(
                        Map.of("text", promptText)
                    )
                )
            ),
            "systemInstruction", Map.of(
                "parts", List.of(
                    Map.of("text", systemInstruction)
                )
            )
        );

        String responseJson = executeWithRetry(url, requestBody);
        return extractTextFromResponse(responseJson);
    }

    /**
     * Thực thi HTTP POST với retry tự động khi gặp 503.
     * Retry tối đa 1 lần, chờ 1 giây giữa các lần thử.
     */
    private String executeWithRetry(String url, Map<String, Object> requestBody) throws Exception {
        int maxRetries = 1;
        Exception lastException = null;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return this.restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
            } catch (org.springframework.web.client.HttpServerErrorException e) {
                lastException = e;
                if (e.getStatusCode().value() == 503 && attempt < maxRetries) {
                    log.warn("[GEMINI 503] Server quá tải, retry sau 1 giây... (attempt {})", attempt + 1);
                    Thread.sleep(1000);
                } else {
                    throw e;
                }
            }
        }
        throw lastException;
    }

    /** Trích xuất text response từ JSON trả về của Gemini API */
    private String extractTextFromResponse(String responseJson) throws Exception {
        JsonNode rootNode = objectMapper.readTree(responseJson);
        return rootNode.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text")
            .asText();
    }

    @Override
    public VoiceEvaluationResponse evaluateSimplePronunciation(MultipartFile audioFile, String targetText) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new AppException(ErrorCode.AUDIO_FILE_REQUIRED);
        }
        if (targetText == null || targetText.isBlank()) {
            throw new AppException(ErrorCode.VOICE_TARGET_TEXT_EMPTY);
        }
        if (audioFile.getSize() > 5 * 1024 * 1024) {
            throw new AppException(ErrorCode.AUDIO_FILE_TOO_LARGE);
        }
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }

        // Rate limiting: 1 request / 5 seconds per user for voice AI
        String limitKey = "ai:limit:voice:" + currentUser.getId();
        if (redisHelper.find(limitKey, String.class) != null) {
            log.warn("[AI LIMIT] User {} spam yêu cầu voice AI", currentUser.getUsername());
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisHelper.save(limitKey, "1", java.time.Duration.ofSeconds(5));

        try {
            byte[] audioBytes = audioFile.getBytes();
            MimeType mimeType = MimeTypeUtils.parseMimeType(
                    audioFile.getContentType() != null ? audioFile.getContentType() : "audio/webm");

            String systemInstruction = String.format(PRONUNCIATION_PROMPT_TEMPLATE, targetText);

            String rawResponse = callGeminiDirect(audioBytes, mimeType, systemInstruction);
            log.info("[VOICE EVALUATION] Raw response: {}", rawResponse);

            String fixedJson = sanitizeJson(rawResponse);
            return objectMapper.readValue(fixedJson, VoiceEvaluationResponse.class);

        } catch (IOException e) {
            log.error("Lỗi đọc file âm thanh", e);
            throw new AppException(ErrorCode.VOICE_PROCESSING_ERROR);
        } catch (Exception e) {
            log.error("Lỗi đánh giá phát âm", e);
            // Trả về DTO rỗng nếu AI không thể phân tích âm thanh (im lặng hoặc nhiễu) hoặc API lỗi
            return VoiceEvaluationResponse.builder()
                    .score(0)
                    .accuracyLevel("IMPROVABLE")
                    .feedback("Không thể nhận diện giọng nói hoặc kết nối AI gặp sự cố. Vui lòng nói to rõ ràng hơn hoặc kiểm tra Micro/đường truyền mạng.")
                    .wordsAnalysis(List.of())
                    .build();
        }
    }

    @Override
    public VoiceChatResponse evaluateChatConversation(MultipartFile audioFile, String topicName, String historyJson) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new AppException(ErrorCode.AUDIO_FILE_REQUIRED);
        }
        if (audioFile.getSize() > 5 * 1024 * 1024) {
            throw new AppException(ErrorCode.AUDIO_FILE_TOO_LARGE);
        }
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }

        // Rate limiting: 1 request / 5 seconds per user for voice AI
        String limitKey = "ai:limit:voice:" + currentUser.getId();
        if (redisHelper.find(limitKey, String.class) != null) {
            log.warn("[AI LIMIT] User {} spam yêu cầu voice AI", currentUser.getUsername());
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisHelper.save(limitKey, "1", java.time.Duration.ofSeconds(5));

        try {
            byte[] audioBytes = audioFile.getBytes();
            MimeType mimeType = MimeTypeUtils.parseMimeType(
                    audioFile.getContentType() != null ? audioFile.getContentType() : "audio/webm");

            String systemInstruction = String.format(KAIWA_PROMPT_TEMPLATE, topicName, historyJson);

            String rawResponse = callGeminiDirect(audioBytes, mimeType, systemInstruction);
            log.info("[VOICE CHAT KAIWA] Raw response: {}", rawResponse);

            String fixedJson = sanitizeJson(rawResponse);
            return objectMapper.readValue(fixedJson, VoiceChatResponse.class);

        } catch (IOException e) {
            log.error("Lỗi đọc file âm thanh", e);
            throw new AppException(ErrorCode.VOICE_PROCESSING_ERROR);
        } catch (Exception e) {
            log.error("Lỗi Kaiwa AI Coach", e);
            return VoiceChatResponse.builder()
                    .userSpokenText("")
                    .userSpokenTranslation("")
                    .pronunciationScore(0)
                    .pronunciationFeedback("Không nghe rõ giọng nói hoặc kết nối AI gặp sự cố. Vui lòng nói to rõ ràng hơn hoặc kiểm tra Micro/đường truyền mạng.")
                    .isGrammarValid(true)
                    .grammarFeedback("")
                    .nextAiResponseText("もう一度話してください。")
                    .nextAiResponseTranslation("Vui lòng nói lại một lần nữa.")
                    .build();
        }
    }

    @Override
    public VoiceDialogueResponse generateDialogue(String topicName) {
        if (topicName == null || topicName.isBlank()) {
            throw new AppException(ErrorCode.VOICE_TARGET_TEXT_EMPTY);
        }

        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser != null) {
            String limitKey = "ai:limit:voice:" + currentUser.getId();
            if (redisHelper.find(limitKey, String.class) != null) {
                log.warn("[AI LIMIT] User {} spam yêu cầu tạo hội thoại", currentUser.getUsername());
                throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
            }
            redisHelper.save(limitKey, "1", java.time.Duration.ofSeconds(5));
        }

        try {
            String systemInstruction = String.format(DIALOGUE_PROMPT_TEMPLATE, topicName);
            String rawResponse = callGeminiTextDirect(systemInstruction, "Tạo hội thoại cho chủ đề: " + topicName);
            log.info("[VOICE DIALOGUE GENERATE] Raw response: {}", rawResponse);

            String fixedJson = sanitizeJson(rawResponse);
            return objectMapper.readValue(fixedJson, VoiceDialogueResponse.class);
        } catch (Exception e) {
            log.error("Lỗi khi tạo hội thoại AI", e);
            // Trả về một câu hỏi mặc định trong trường hợp lỗi
            return VoiceDialogueResponse.builder()
                    .question("今日はいい天気ですね？")
                    .questionVi("Hôm nay thời tiết đẹp nhỉ?")
                    .options(List.of(
                            new VoiceDialogueResponse.Option("そうですね。とても暖かいですね。", "Đúng thế thật. Thời tiết ấm áp nhỉ."),
                            new VoiceDialogueResponse.Option("はい、散歩に行きたくなりますね。", "Vâng, thời tiết này làm tôi muốn đi dạo."),
                            new VoiceDialogueResponse.Option("いいえ, 午後から雨が降るそうです。", "Không, nghe nói chiều nay trời sẽ mưa.")
                    ))
                    .build();
        }
    }

    private String sanitizeJson(String raw) {
        if (raw == null || raw.isBlank()) return "{}";
        // Loại bỏ markdown code fence
        String fixed = raw.replaceAll("(?s)```(json)?", "").trim();
        // Trích xuất JSON object/array nếu có text thừa bao quanh
        int startObj = fixed.indexOf('{');
        int startArr = fixed.indexOf('[');
        int start = -1;
        if (startObj >= 0 && startArr >= 0) {
            start = Math.min(startObj, startArr);
        } else if (startObj >= 0) {
            start = startObj;
        } else if (startArr >= 0) {
            start = startArr;
        }
        if (start > 0) {
            char openChar = fixed.charAt(start);
            char closeChar = openChar == '{' ? '}' : ']';
            int end = fixed.lastIndexOf(closeChar);
            if (end > start) {
                fixed = fixed.substring(start, end + 1);
            }
        }
        return fixed.trim();
    }
}
