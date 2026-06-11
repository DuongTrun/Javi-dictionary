package com.example.javi.service.Impl;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;


import com.example.javi.dto.request.GrammarCheckSourceText;
import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.GrammarCheckResult;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.AccountType;
import com.example.javi.entity.EngineType;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.GeminiService;
import com.example.javi.service.OcrService;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.pemistahl.lingua.api.Language;
import com.github.pemistahl.lingua.api.LanguageDetector;
import com.github.pemistahl.lingua.api.LanguageDetectorBuilder;

import com.example.javi.service.cache.RedisHelper;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GeminiServiceImpl implements GeminiService {
    ChatClient chatClient;
    SecurityUtil securityUtil;
    TranslationMapper translationMapper;
    TranslationRepository translationRepository;
    OcrService ocrService;
    UsersService usersService;
    ObjectMapper objectMapper;
    RedisHelper redisHelper;

    public GeminiServiceImpl(
            ChatClient.Builder builder,
            SecurityUtil securityUtil,
            TranslationMapper translationMapper,
            TranslationRepository translationRepository,
            OcrService ocrService,
            UsersService usersService,
            ObjectMapper objectMapper,
            RedisHelper redisHelper) {
        this.chatClient = builder.build();
        this.securityUtil = securityUtil;
        this.translationMapper = translationMapper;
        this.translationRepository = translationRepository;
        this.ocrService = ocrService;
        this.usersService = usersService;
        this.objectMapper = objectMapper;
        this.redisHelper = redisHelper;
    }

    LanguageDetector detector = LanguageDetectorBuilder.fromLanguages(
                    Language.VIETNAMESE, Language.JAPANESE, Language.ENGLISH)
            .build();

    @Override
    @Transactional
    public TranslateResponse translateText(TranslateRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }
        String text = request.getSourceText();
        if (text == null || text.isBlank()) {
            throw new AppException(ErrorCode.SOURCE_TEXT_CANNOT_EMPTY);
        }
        if (text.length() > 5000) {
            throw new AppException(ErrorCode.SOURCE_TEXT_TOO_LONG);
        }

        Language detectedLang = detector.detectLanguageOf(request.getSourceText());
        String detectedLangCode = detectedLang.getIsoCode639_1().toString();
        String currentLang = request.getSourceLang();
        if (currentLang == null || currentLang.isBlank() || !detectedLangCode.equalsIgnoreCase(currentLang)) {
            log.info(
                    "[LANG DETECT] Phát hiện ngôn ngữ thực tế là '{}', cập nhật sourceLang từ '{}' → '{}'",
                    detectedLangCode,
                    currentLang,
                    detectedLangCode);
            request.setSourceLang(detectedLangCode);
        }

        // Check cache before calling AI
        java.util.Optional<Translation> cachedTranslation = translationRepository.findFirstBySourceTextAndSourceLangAndTargetLangAndEngine(
                request.getSourceText(), request.getSourceLang(), request.getTargetLang(), EngineType.AI);
        if (cachedTranslation.isPresent()) {
            log.info("[AI TRANSLATE CACHE HIT] Đã tìm thấy bản dịch AI trong DB");
            return translationMapper.translationToTranslateResponse(cachedTranslation.get());
        }

        // Rate limiting: 1 request / 5 seconds per user for translation
        String limitKey = "ai:limit:translate:" + currentUser.getId();
        if (redisHelper.find(limitKey, String.class) != null) {
            log.warn("[AI LIMIT] User {} spam yêu cầu dịch thuật", currentUser.getUsername());
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisHelper.save(limitKey, "1", java.time.Duration.ofSeconds(5));

        // dịch vẫn sượng do prompt chưa chuẩn
        String prompt = String.format(
                """
						Please translate this paragraph into %s so that it sounds natural, easy to read,
						and conveys the original feeling.
						Output only the final translation — do not include explanations, brackets, or notes.
						The paragraph to be translated is: %s
						""",
                request.getTargetLang(), request.getSourceText());

        try {
            String translatedText = chatClient.prompt().user(prompt).call().content();

            Translation translation = translationMapper.toTranslation(request);
            translation.setUser(currentUser);
            translation.setTranslatedText(translatedText);
            translation.setEngine(EngineType.AI);
            translationRepository.save(translation);

            return translationMapper.translationToTranslateResponse(translation);
        } catch (Exception e) {
            log.error("[AI TRANSLATE FAIL] Lỗi dịch AI cho văn bản '{}': {}", request.getSourceText(), e.getMessage(), e);
            throw new AppException(ErrorCode.ERROR_TRANSLATION);
        }
    }

    @Override
    @Transactional
    public Flux<String> streamTranslateText(TranslateRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }
        String text = request.getSourceText();
        if (text == null || text.isBlank()) {
            throw new AppException(ErrorCode.SOURCE_TEXT_CANNOT_EMPTY);
        }
        if (text.length() > 5000) {
            throw new AppException(ErrorCode.SOURCE_TEXT_TOO_LONG);
        }

        Language detectedLang = detector.detectLanguageOf(request.getSourceText());
        String detectedLangCode = detectedLang.getIsoCode639_1().toString();
        String currentLang = request.getSourceLang();
        if (currentLang == null || currentLang.isBlank() || !detectedLangCode.equalsIgnoreCase(currentLang)) {
            log.info(
                    "[LANG DETECT] Phát hiện ngôn ngữ thực tế là '{}', cập nhật sourceLang từ '{}' → '{}'",
                    detectedLangCode,
                    currentLang,
                    detectedLangCode);
            request.setSourceLang(detectedLangCode);
        }

        // Check cache before calling AI
        java.util.Optional<Translation> cachedTranslation = translationRepository.findFirstBySourceTextAndSourceLangAndTargetLangAndEngine(
                request.getSourceText(), request.getSourceLang(), request.getTargetLang(), EngineType.AI);
        if (cachedTranslation.isPresent()) {
            log.info("[AI TRANSLATE STREAM CACHE HIT] Trả về bản dịch AI từ DB cho stream");
            return Flux.just(cachedTranslation.get().getTranslatedText());
        }

        // Rate limiting: 1 request / 5 seconds per user for translation
        String limitKey = "ai:limit:translate:" + currentUser.getId();
        if (redisHelper.find(limitKey, String.class) != null) {
            log.warn("[AI LIMIT] User {} spam yêu cầu dịch thuật", currentUser.getUsername());
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisHelper.save(limitKey, "1", java.time.Duration.ofSeconds(5));

        String prompt = String.format(
                """
						Please translate this paragraph into %s so that it sounds natural, easy to read,
						and conveys the original feeling.
						Output only the final translation — do not include explanations, brackets, or notes.
						The paragraph to be translated is: %s
						""",
                request.getTargetLang(), request.getSourceText());

        StringBuilder fullResult = new StringBuilder();
        return chatClient.prompt().user(prompt).stream().content()
                .doOnNext(fullResult::append)
                .doOnComplete(() -> {
                    String translatedText = fullResult.toString();
                    if (!translatedText.isBlank()) {
                        Translation translation = translationMapper.toTranslation(request);
                        translation.setUser(currentUser);
                        translation.setTranslatedText(translatedText);
                        translation.setEngine(EngineType.AI);
                        translationRepository.save(translation);
                        log.info("[AI TRANSLATE STREAM SAVE] Đã lưu bản dịch AI vào DB cho user {}", currentUser.getUsername());
                    }
                })
                .doOnError(err -> log.error("[AI TRANSLATE STREAM FAIL] Lỗi khi stream dịch AI: {}", err.getMessage()));
    }


    @Override
    @Transactional
    public TranslateResponse translateImage(MultipartFile imageFile, String targetLang, String sourceLang) {
        Users user = securityUtil.getCurrentUser();
        if (user == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (user.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(user);
        }

        // OCR ảnh
        String extractedText = ocrService.extractTextFromImage(imageFile);
        if (extractedText == null || extractedText.isBlank())
            throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);

        // Gọi translateText (vì Premium user luôn hợp lệ)
        TranslateRequest translateRequest = new TranslateRequest();
        translateRequest.setTargetLang(targetLang);
        translateRequest.setSourceText(extractedText);
        translateRequest.setSourceLang(sourceLang);
        return translateText(translateRequest);
    }

    @Retryable(
            value = {org.springframework.ai.retry.NonTransientAiException.class},
            maxAttempts = 3, // tổng cộng 3 lần thử
            backoff = @Backoff(delay = 2000, multiplier = 2) // delay tăng dần 2s, 4s
            )
    @Override
    public String explainWord(String word) {
        String prompt = String.format(
                """
						Bạn là một giáo viên người Nhật chuyên dạy tiếng Nhật cho người Việt.
						Hãy giải thích từ vựng: "%s" một cách tự nhiên.
						Cách trình bày mong muốn:
						1. Dòng đầu: Viết từ vựng gốc bằng tiếng Nhật.
						Ví dụ: 「飲む」(のむ, nomu)
						2. Viết một đoạn ngắn giải thích ý nghĩa tổng quát, phạm vi sử dụng của từ, dễ hiểu, tự nhiên.
						3. Sau đó liệt kê các cách dùng phổ biến nhất theo dạng:
							1. Nghĩa 1 (mô tả nghĩa, dùng khi nào)
								Ví dụ: Câu ví dụ tiếng Nhật (Phiên âm Romaji)
								Dịch nghĩa tiếng Việt
							2. Nghĩa 2 ...
						4. Nếu có thể, chọn ví dụ sinh động, gần gũi (đời sống, công việc, học tập).
						5. Tuyệt đối không dùng ký tự đặc biệt như *, **, #, hoặc markdown.
						6. Trình bày rõ ràng, có dấu xuống dòng tự nhiên, dễ hiển thị trên web.
						7. Trả về hoàn toàn bằng tiếng Việt (ngoại trừ từ và ví dụ tiếng Nhật).
						8. Không thêm phần tiêu đề, giới thiệu hay lời chào.
						""",
                word);

        String result = chatClient.prompt().user(prompt).call().content();

        log.info("AI explanation for {}: {}", word, result);
        return result;
    }

    @Override
    public Flux<String> streamExplainWord(String word) {
        String prompt = String.format(
                """
						Bạn là một giáo viên người Nhật chuyên dạy tiếng Nhật cho người Việt.
						Hãy giải thích từ vựng: "%s" một cách tự nhiên.
						Cách trình bày mong muốn:
						1. Dòng đầu: Viết từ vựng gốc bằng tiếng Nhật.
						Ví dụ: 「飲む」(のむ, nomu)
						2. Viết một đoạn ngắn giải thích ý nghĩa tổng quát, phạm vi sử dụng của từ, dễ hiểu, tự nhiên.
						3. Sau đó liệt kê các cách dùng phổ biến nhất theo dạng:
							1. Nghĩa 1 (mô tả nghĩa, dùng khi nào)
								Ví dụ: Câu ví dụ tiếng Nhật (Phiên âm Romaji)
								Dịch nghĩa tiếng Việt
							2. Nghĩa 2 ...
						4. Nếu có thể, chọn ví dụ sinh động, gần gũi (đời sống, công việc, học tập).
						5. Tuyệt đối không dùng ký tự đặc biệt như *, **, #, hoặc markdown.
						6. Trình bày rõ ràng, có dấu xuống dòng tự nhiên, dễ hiển thị trên web.
						7. Trả về hoàn toàn bằng tiếng Việt (ngoại trừ từ và ví dụ tiếng Nhật).
						8. Không thêm phần tiêu đề, giới thiệu hay lời chào.
						""",
                word);

        return chatClient.prompt().user(prompt).stream().content();
    }


    /**
     * Khi retry 3 lần vẫn lỗi → Spring tự động gọi hàm này.
     * Phải đúng loại exception như trong @Retryable.
     */
    @Recover
    public String recoverFromGeminiError(NonTransientAiException ex, String word) {
        log.error("[GEMINI FAIL] Không thể giải thích từ '{}': {}", word, ex.getMessage());
        return "Hệ thống đang quá tải. Vui lòng thử lại sau ít phút.";
    }

    @Override
    public GrammarCheckResult checkGrammar(GrammarCheckSourceText request) {
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }

        String prompt = String.format(
                """
						Bạn là chuyên gia ngữ pháp tiếng Nhật.
						Hãy kiểm tra và sửa ngữ pháp của đoạn văn sau, sau đó giải thích các lỗi một cách dễ hiểu vì sao phải sửa.
						Yêu cầu quan trọng:
						1. Nếu có lỗi, giải thích (explanation) nên trình bày rõ ràng theo từng câu
						hoặc cấu trúc ngữ pháp, nêu rõ và chi tiết vì sao phải sửa — không liệt kê từng chữ,
						không giải thích bằng ngôn ngữ đoạn văn cần kiểm tra ngữ pháp.
						2. Các phần (explanation, mean) phải được viết bằng ngôn ngữ %s.
						""",
                request.getTargetLang());

        SystemMessage system = new SystemMessage(prompt);
        UserMessage user = new UserMessage(request.getSourceText());
        Prompt grammarPrompt = new Prompt(system, user);

        return chatClient.prompt(grammarPrompt).call().entity(GrammarCheckResult.class);
    }

    @Override
    @Transactional(readOnly = true)
    public KanjiDecompositionResult analyzeKanjiStructure(String kanji) {
        Users user = securityUtil.getCurrentUser();
        if (user == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (user.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(user);
        }

        String prompt =
                """
		Bạn là chuyên gia Hán tự. Hãy PHÂN TÍCH CẤU TẠO chữ: %s
		YÊU CẦU:
		- Trả JSON HỢP LỆ, không kèm chữ nào ngoài JSON.
		- Đi theo cây phân rã từ chữ gốc xuống các bộ cấu thành chữ đó.
		- Không được để "components": null → luôn là mảng [].
		- Mỗi node bắt buộc có:
		kanji: string
		sinoViName: string (Cách đọc hán tự của Việt Nam)
		explanation: string  (phải mô tả chi tiết và giàu hình ảnh, Vai trò bộ này trong cấu tạo, Ý nghĩa gốc và nghĩa mở rộng hiện đại. Gợi ý nhớ, ví dụ liên hệ (nếu có))
		components: ComponentNode[]

		ĐỘ SÂU:
		- Tách tối thiểu 2 cấp, tối đa 3 cấp (hoặc cho đến khi gặp bộ cơ bản).
		- Luôn bọc các giá trị chuỗi trong dấu ngoặc kép ("...").
		- Không sinh markdown hoặc ```json.

		MẪU JSON:
		{
		"kanji": "例",
		"sinoViName": "LỆ",
		"explanation": "Chữ 例 gồm 亻 (người) + 列 (liệt: xếp hàng), chỉ người được chọn làm mẫu.",
		"components": [
			{ "kanji": "亻", "sinoViName": "NHÂN", "explanation": "", "components": [] },
			{
			"kanji": "列", "sinoViName": "LIỆT", "explanation": "",
			"components": [
				{ "kanji": "刂", "sinoViName": "ĐAO", "explanation": "", "components": [] },
				{
				"kanji": "歹", "sinoViName": "NGẠT, ĐÃI", "explanation": "",
				"components": [
					{ "kanji": "一", "sinoViName": "NHẤT", "explanation": "", "components": [] },
					{ "kanji": "夕", "sinoViName": "TỊCH", "explanation": "", "components": [] }
				]
				}
			]
			}
		]
		}

		Chỉ trả về JSON hợp lệ theo đúng schema trên cho chữ: %s
		"""
                        .formatted(kanji, kanji);

        try {
            // Bổ sung SystemMessage + UserMessage để Gemini hiểu
            SystemMessage systemMsg = new SystemMessage("Bạn là chuyên gia Hán tự, luôn trả về JSON hợp lệ.");
            UserMessage userMsg = new UserMessage(prompt);
            Prompt fullPrompt = new Prompt(systemMsg, userMsg);

            String rawResponse = chatClient.prompt(fullPrompt).call().content();

            // Sửa lỗi cú pháp JSON (Gemini hay quên ngoặc kép quanh ký tự Hán)
            String fixedJson = sanitizeJson(rawResponse);

            return objectMapper.readValue(fixedJson, KanjiDecompositionResult.class);

        } catch (Exception e) {
            log.error("Lỗi parse JSON Gemini ({}): {}", kanji, e.getMessage());
            throw new AppException(ErrorCode.INVALID_JSON_FROM_AI);
        }
    }

    /**
     * Làm sạch JSON trả về từ Gemini — thêm ngoặc kép quanh ký tự Hán bị bỏ sót
     * và loại bỏ phần markdown như ```json
     */
    private String sanitizeJson(String raw) {
        if (raw == null) return "";

        // Bỏ phần ```json hoặc ``` nếu có
        String fixed = raw.replaceAll("(?s)```(json)?", "").trim();

        // Thêm ngoặc kép quanh ký tự Hán nếu bị bỏ sót: "kanji": 豆 -> "kanji": "豆"
        fixed = fixed.replaceAll("\"kanji\"\\s*:\\s*([^\\s\"{}\\[\\],])", "\"kanji\": \"$1\"");

        // Đảm bảo JSON sạch gọn
        return fixed.trim();
    }
}
