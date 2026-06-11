package com.example.javi.service.Impl;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Base64;

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

    public VoiceServiceImpl(
            ChatClient.Builder builder, 
            ObjectMapper objectMapper, 
            @Value("${spring.ai.openai.api-key}") String apiKey,
            SecurityUtil securityUtil,
            UsersService usersService) {
        this.chatClient = builder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.securityUtil = securityUtil;
        this.usersService = usersService;

        // Pooled JDK HTTP Client request factory for connection reuse
        java.net.http.HttpClient httpClient = java.net.http.HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(45))
                .build();
        org.springframework.http.client.JdkClientHttpRequestFactory requestFactory = 
                new org.springframework.http.client.JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(45000);

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    private String callGeminiDirect(byte[] audioBytes, MimeType mimeType, String systemInstruction) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "parts", List.of(
                        Map.of("inlineData", Map.of(
                            "mimeType", mimeType.toString(),
                            "data", Base64.getEncoder().encodeToString(audioBytes)
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

        String responseJson = this.restClient.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(String.class);

        JsonNode rootNode = objectMapper.readTree(responseJson);
        String rawResponse = rootNode.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text")
            .asText();

        return rawResponse;
    }

    private String callGeminiTextDirect(String systemInstruction, String promptText) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

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

        String responseJson = this.restClient.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(String.class);

        JsonNode rootNode = objectMapper.readTree(responseJson);
        String rawResponse = rootNode.path("candidates")
            .path(0)
            .path("content")
            .path("parts")
            .path(0)
            .path("text")
            .asText();

        return rawResponse;
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

        try {
            byte[] audioBytes = audioFile.getBytes();
            MimeType mimeType = MimeTypeUtils.parseMimeType(
                    audioFile.getContentType() != null ? audioFile.getContentType() : "audio/webm");

            String systemInstruction = String.format(
                    """
                    Bạn là chuyên gia huấn luyện phát âm tiếng Nhật dành cho người Việt Nam.
                    Nhiệm vụ của bạn:
                    1. Lắng nghe tệp âm thanh (audio) được gửi kèm.
                    2. So sánh âm thanh này với văn bản tiếng Nhật mẫu: "%s".
                    3. Phân tích chi tiết lỗi phát âm (ví dụ: thiếu trường âm, sai âm ngắt っ, phát âm sai phụ âm hoặc nguyên âm).
                    4. Trả về kết quả CHỈ dưới dạng cấu trúc JSON hợp lệ sau đây, không bọc markdown hay chữ viết thừa, không có ```json ở đầu.

                    {
                      "score": 85,
                      "accuracyLevel": "GOOD",
                      "feedback": "Nhận xét tổng quát bằng tiếng Việt về phát âm của người học",
                      "wordsAnalysis": [
                         {
                           "word": "từ tiếng Nhật mẫu",
                           "isCorrect": true,
                           "phonemeError": "Nếu isCorrect là false, ghi rõ lỗi sai bằng tiếng Việt. Nếu isCorrect là true, để trống."
                         }
                      ]
                    }
                    """, targetText);

            String rawResponse = callGeminiDirect(audioBytes, mimeType, systemInstruction);
            log.info("[VOICE EVALUATION] Raw response: {}", rawResponse);

            String fixedJson = sanitizeJson(rawResponse);
            return objectMapper.readValue(fixedJson, VoiceEvaluationResponse.class);

        } catch (IOException e) {
            log.error("Lỗi đọc file âm thanh", e);
            throw new AppException(ErrorCode.VOICE_PROCESSING_ERROR);
        } catch (Exception e) {
            log.error("Lỗi đánh giá phát âm", e);
            // Trả về DTO rỗng nếu AI không thể phân tích âm thanh (im lặng hoặc nhiễu)
            return VoiceEvaluationResponse.builder()
                    .score(0)
                    .accuracyLevel("IMPROVABLE")
                    .feedback("Không thể nhận diện giọng nói. Vui lòng nói to rõ ràng hơn hoặc kiểm tra Micro.")
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

        try {
            byte[] audioBytes = audioFile.getBytes();
            MimeType mimeType = MimeTypeUtils.parseMimeType(
                    audioFile.getContentType() != null ? audioFile.getContentType() : "audio/webm");

            String systemInstruction = String.format(
                    """
                    Bạn là đối tác luyện hội thoại tiếng Nhật (Kaiwa Partner) và đồng thời là giáo viên chấm điểm.
                    Ngữ cảnh cuộc hội thoại: Chủ đề "%s".
                    Lịch sử các câu đối đáp trước đó (JSON): %s

                    Nhiệm vụ của bạn:
                    1. Lắng nghe tệp âm thanh (audio) người học nói tự do.
                    2. Nhận diện chính xác văn bản tiếng Nhật (STT) người học vừa nói.
                    3. Dịch nghĩa câu nói đó sang tiếng Việt.
                    4. Đánh giá phát âm (chấm điểm từ 0-100, chỉ rõ lỗi âm ngắt, trường âm bị sai hoặc ngắt nhịp chưa đúng).
                    5. Kiểm tra ngữ pháp câu người học nói. Nếu chưa tự nhiên hoặc sai ngữ pháp, hãy đề xuất câu mẫu tự nhiên hơn của người Nhật và giải thích ngắn gọn bằng tiếng Việt.
                    6. Đưa ra câu đáp tiếp theo của bạn (bằng tiếng Nhật ngắn gọn, dưới 25 từ, phù hợp với ngữ cảnh hội thoại hiện tại) để tiếp tục cuộc trò chuyện.
                    7. Trả về kết quả CHỈ dưới dạng cấu trúc JSON hợp lệ sau đây, không bọc markdown hay chữ viết thừa, không có ```json ở đầu.

                    {
                      "userSpokenText": "chữ tiếng Nhật nhận diện được từ giọng nói của user",
                      "userSpokenTranslation": "dịch nghĩa tiếng Việt câu của user",
                      "pronunciationScore": 85,
                      "pronunciationFeedback": "Lời khuyên/nhận xét phát âm cụ thể bằng tiếng Việt",
                      "isGrammarValid": true,
                      "grammarFeedback": "Nhận xét ngữ pháp và câu gợi ý tự nhiên hơn bằng tiếng Việt (nếu có, nếu không thì để trống)",
                      "nextAiResponseText": "câu đáp lại tiếp theo của bạn bằng tiếng Nhật",
                      "nextAiResponseTranslation": "dịch tiếng Việt câu đáp lại của bạn"
                    }
                    """, topicName, historyJson);

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
                    .pronunciationFeedback("Không nghe rõ giọng nói. Vui lòng nói to rõ ràng hơn hoặc kiểm tra Micro.")
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

        try {
            String systemInstruction = 
                    """
                    Bạn là một trợ lý AI thiết kế câu hỏi tình huống giao tiếp tiếng Nhật chuyên nghiệp.
                    Hãy tạo ra một tình huống hội thoại mẫu (gồm 1 câu hỏi và 3 câu trả lời gợi ý) phù hợp với ngữ cảnh của chủ đề được yêu cầu.
                    Ngữ cảnh chủ đề: %s.
                    
                    Yêu cầu:
                    1. Tạo ra 1 câu hỏi tiếng Nhật tự nhiên, ngắn gọn (phù hợp trình độ giao tiếp sơ trung cấp).
                    2. Dịch nghĩa câu hỏi đó sang tiếng Việt.
                    3. Đưa ra 3 phương án trả lời bằng tiếng Nhật khác nhau (ví dụ: một khẳng định, một phủ định, một phản hồi mở rộng) để người học lựa chọn để trả lời.
                    4. Dịch nghĩa của 3 phương án trả lời đó sang tiếng Việt.
                    5. Trả về kết quả CHỈ dưới dạng cấu trúc JSON hợp lệ sau đây, không bọc markdown hay chữ viết thừa, không có ```json ở đầu.

                    {
                      "question": "câu hỏi tiếng Nhật",
                      "questionVi": "dịch nghĩa tiếng Việt câu hỏi",
                      "options": [
                        {
                          "jp": "phương án 1 tiếng Nhật",
                          "vi": "phương án 1 tiếng Việt"
                        },
                        {
                          "jp": "phương án 2 tiếng Nhật",
                          "vi": "phương án 2 tiếng Việt"
                        },
                        {
                          "jp": "phương án 3 tiếng Nhật",
                          "vi": "phương án 3 tiếng Việt"
                        }
                      ]
                    }
                    """;

            String formattedInstruction = String.format(systemInstruction, topicName);
            String rawResponse = callGeminiTextDirect(formattedInstruction, "Hãy tạo hội thoại cho chủ đề: " + topicName);
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
