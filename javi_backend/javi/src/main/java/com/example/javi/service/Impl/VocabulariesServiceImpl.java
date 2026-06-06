package com.example.javi.service.Impl;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import com.example.javi.dto.request.MeaningRequest;
import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.VocabulariesMapper;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.repository.TopicRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.repository.VocabulariesRepository;
import com.example.javi.service.GeminiService;
import com.example.javi.service.UsersService;
import com.example.javi.service.VocabulariesService;
import com.example.javi.service.cache.RedisHelper;
import com.example.javi.service.cache.VocabulariesCacheService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabulariesServiceImpl implements VocabulariesService {
    VocabulariesRepository vocabulariesRepository;
    KanjiRepository kanjiRepository;
    VocabulariesMapper vocabulariesMapper;
    SecurityUtil securityUtil;
    GeminiService geminiService;
    UsersService usersService;
    UsersRepository usersRepository;
    VocabulariesCacheService vocabulariesCacheService;
    RedisHelper redisHelper;
    TopicRepository topicRepository;

    @Override
    @Transactional
    public VocabResponse createVocabulary(VocabRequest request) {
        Optional<Vocabularies> existWord = vocabulariesRepository.findByWord(request.getWord());
        if (existWord.isPresent()) {
            throw new AppException(ErrorCode.EXIST_WORD);
        }

        // DANH SÁCH ĐỂ LƯU TRỮ CÁC ENTITY KANJI ĐÃ TÌM HOẶC TẠO
        List<Kanji> associatedKanjis = new ArrayList<>();

        request.getWord().codePoints().forEach(c -> {
            String japaneseCharacter = Character.toString(c);
            // Tách từng kí tự, nếu là kanji cho vào trong
            if (ValidationUtils.isKanji(japaneseCharacter)) {
                // Kiểm tra sự tồn tại
                Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(japaneseCharacter);

                Kanji kanji;
                if (existingKanji.isEmpty()) {
                    // Nếu chưa tồn tại, tạo mới và lưu
                    kanji = new Kanji();
                    kanji.setCharacterName(japaneseCharacter);
                    kanji = kanjiRepository.save(kanji); // lưu để có ID
                } else {
                    // Nếu tồn tại, lấy đối tượng đó
                    kanji = existingKanji.get();
                }

                // Thêm vào danh sách liên kết
                associatedKanjis.add(kanji);
            }
        });

        List<Topic> associatedTopics = new ArrayList<>();
        if (request.getTopicIds() != null && !request.getTopicIds().isEmpty()) {
            associatedTopics = topicRepository.findAllById(request.getTopicIds());
        }

        Vocabularies vocab = Vocabularies.builder()
                .word(request.getWord())
                .romaji(request.getRomaji())
                .hiragana(request.getHiragana())
                .katakana(request.getKatakana())
                .wordType(request.getWordType())
                .level(request.getLevel())
                .topics(associatedTopics)
                .build();

        // (ánh xạ MEANING và MEANING EXAMPLE giữ nguyên)
        List<Meaning> meanings = new ArrayList<>();
        for (MeaningRequest meaningDto : request.getMeanings()) {
            Meaning meaning = Meaning.builder()
                    .meaningVn(meaningDto.getMeaningVn())
                    .description(meaningDto.getDescription())
                    .vocabularies(vocab)
                    .build();

            List<MeaningExample> examples = meaningDto.getExamples().stream()
                    .map(exampleDto -> MeaningExample.builder()
                            .jaSentence(exampleDto.getJaSentence())
                            .viSentence(exampleDto.getViSentence())
                            .meaning(meaning)
                            .build())
                    .toList();

            meaning.setExamples(examples);
            meanings.add(meaning);
        }

        // XỬ LÝ LIÊN KẾT KANJI THIẾU
        // Gán danh sách Kanji vào đối tượng Vocabularies
        vocab.setKanjis(associatedKanjis);

        // Gán ngược lại Meaning vào Vocabularies
        vocab.setMeanings(meanings);

        // Lưu Vocabularies để:
        // - Lưu Vocabularies
        // - Lưu Meanings và Examples (do cascade)
        // - Lưu các liên kết Many-to-Many vào bảng 'vocabulary_kanji' (do đã setKanjis)
        Vocabularies vocabularies = vocabulariesRepository.save(vocab);
        VocabResponse vocabResponse = vocabulariesMapper.toDto(vocabularies);
        // Xóa cache danh sách do có thêm từ mới
        vocabulariesCacheService.clearAllPages();
        log.info("[CACHE CLEAR] Xóa toàn bộ cache page sau khi thêm từ mới");
        vocabulariesCacheService.save(vocabResponse.getWord(), vocabResponse);
        vocabulariesCacheService.clearAllSearches();
        return vocabResponse;
    }

    @Override
    @Transactional
    public VocabResponse updateVocabulary(Long id, VocabUpdateDTO request) {
        Vocabularies vocab =
                vocabulariesRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));

        if (request.getMeanings() == null || request.getMeanings().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_MEANING);
        }

        if (!request.getWord().equals(vocab.getWord())) {
            List<Kanji> associatedKanjis = new ArrayList<>();

            request.getWord().codePoints().forEach(c -> {
                String japaneseCharacter = Character.toString(c);
                if (ValidationUtils.isKanji(japaneseCharacter)) {
                    Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(japaneseCharacter);

                    Kanji kanji;
                    if (existingKanji.isEmpty()) {
                        kanji = new Kanji();
                        kanji.setCharacterName(japaneseCharacter);
                        kanji = kanjiRepository.save(kanji);
                    } else {
                        kanji = existingKanji.get();
                    }

                    associatedKanjis.add(kanji);
                }
            });

            vocab.getKanjis().clear();
            vocab.getKanjis().addAll(associatedKanjis);
        }

        // Map các field cơ bản từ request sang entity
        vocabulariesMapper.toVocabularies(vocab, request);

        // Cập nhật chủ đề
        List<Topic> updatedTopics = new ArrayList<>();
        if (request.getTopicIds() != null && !request.getTopicIds().isEmpty()) {
            updatedTopics = topicRepository.findAllById(request.getTopicIds());
        }
        vocab.getTopics().clear();
        vocab.getTopics().addAll(updatedTopics);

        // Xoá nghĩa cũ
        vocab.getMeanings().clear();

        // Thêm nghĩa mới từ DTO
        for (MeaningRequest mDto : request.getMeanings()) {
            Meaning meaning = Meaning.builder()
                    .meaningVn(mDto.getMeaningVn())
                    .description(mDto.getDescription())
                    .vocabularies(vocab)
                    .build();

            // Thêm ví dụ cho nghĩa
            List<MeaningExample> examples = mDto.getExamples().stream()
                    .map(exDto -> MeaningExample.builder()
                            .jaSentence(exDto.getJaSentence())
                            .viSentence(exDto.getViSentence())
                            .meaning(meaning)
                            .build())
                    .collect(Collectors.toList());

            meaning.setExamples(examples);

            vocab.getMeanings().add(meaning);
        }

        // Lưu entity
        Vocabularies saved = vocabulariesRepository.save(vocab);
        VocabResponse vocabResponse = vocabulariesMapper.toDto(saved);

        // Cache
        vocabulariesCacheService.delete(vocabResponse.getWord());
        log.info("[CACHE EVICT] Đã xóa cache từ: {}", vocabResponse.getWord());
        vocabulariesCacheService.save(vocabResponse.getWord(), vocabResponse);
        log.info("[CACHE SAVE] Đã lưu cache từ: {}", vocabResponse.getWord());
        vocabulariesCacheService.clearAllPages();
        log.info("[CACHE CLEAR] Xóa toàn bộ cache page sau khi cập nhật từ: {}", vocabResponse.getWord());
        vocabulariesCacheService.deleteExplain(vocabResponse.getWord());
        log.info("[CACHE DELETE] Xóa cache explain của từ '{}'", vocabResponse.getWord());
        vocabulariesCacheService.clearAllSearches();
        // Xóa & cập nhật lại cache detail theo id
        vocabulariesCacheService.deleteById(id);
        vocabulariesCacheService.saveById(id, vocabResponse);

        return vocabResponse;
    }

    @Override
    public List<VocabResponse> searchVocabularies(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        String normalized = keyword.trim();

        List<VocabResponse> cached = vocabulariesCacheService.getSearch(normalized);
        if (cached != null) {
            log.info("[CACHE HIT] vocab keyword: {}", normalized);
            return cached;
        }
        log.info("[CACHE MISS] Vào DB tìm keyword: {}", normalized);

        List<VocabResponse> resultList;

        //  Nếu chứa kanji sẽ tìm chính xác trong word trước
        if (ValidationUtils.containsKanji(normalized)) {
            // Tìm kiếm chính xác (EQUAL) - dùng findFirstByWord để tránh NonUniqueResultException
            Optional<Vocabularies> exactResult = vocabulariesRepository.findFirstByWord(normalized);
            if (exactResult.isPresent()) {
                resultList = List.of(vocabulariesMapper.toDto(exactResult.get()));

                // [CACHE SAVE] lưu lại cache cho kết quả exact match
                vocabulariesCacheService.saveSearch(normalized, resultList);
                log.info("[CACHE SAVE] vocab keyword:{}", normalized);
                return resultList;
            }

            // Không có chính xác sẽ tìm kiếm like (LIMIT 30, sắp xếp từ ngắn nhất)
            List<Vocabularies> likeResult = vocabulariesRepository.findByWordContaining(normalized);
            if (!likeResult.isEmpty()) {
                resultList = likeResult.stream().map(vocabulariesMapper::toDto).collect(Collectors.toList());

                // [CACHE SAVE] lưu lại cache cho kết quả LIKE
                vocabulariesCacheService.saveSearch(normalized, resultList);
                log.info("[CACHE SAVE] vocab keyword:{}", normalized);
                return resultList;
            }

            vocabulariesCacheService.saveSearch(normalized, List.of());
            log.info("[CACHE SAVE_EMPTY] vocab keyword:{}", normalized);
            return List.of();
        }

        // Không có Kanji (là Hiragana/Tiếng Việt), tìm kiếm MỜ
        // Bước 1: Tìm trên word, hiragana, romaji (nhanh - không JOIN bảng meaning)
        List<Vocabularies> fuzzyResults = vocabulariesRepository.findFuzzySearch(normalized);

        // Bước 2: Nếu không tìm được ở bước 1, fallback tìm trên nghĩa tiếng Việt
        if (fuzzyResults.isEmpty()) {
            log.info("[SEARCH FALLBACK] Tìm theo nghĩa tiếng Việt cho keyword: {}", normalized);
            fuzzyResults = vocabulariesRepository.findByMeaningContaining(normalized);
        }

        if (fuzzyResults.isEmpty()) {
            vocabulariesCacheService.saveSearch(normalized, List.of());
            log.info("[CACHE SAVE_EMPTY] vocab keyword:{}", normalized);
            return List.of();
        }

        resultList = fuzzyResults.stream().map(vocabulariesMapper::toDto).collect(Collectors.toList());

        // [CACHE SAVE] lưu lại cache cho kết quả fuzzy search
        vocabulariesCacheService.saveSearch(normalized, resultList);
        log.info("[CACHE SAVE] vocab keyword:{}", normalized);
        return resultList;
    }

    @Override
    public VocabResponse getVocabularyByWord(String word) {
        VocabResponse cached = vocabulariesCacheService.get(word);
        if (cached != null) {
            log.info("[CACHE HIT] vocab: {}", word);
            return cached;
        }
        log.info("[CACHE MISS] Vào DB tìm từ vựng: {}", word);
        Optional<Vocabularies> vocabulary = vocabulariesRepository.findFirstByWord(word);
        if (vocabulary.isEmpty()) {
            throw new AppException(ErrorCode.WORD_NOT_FOUND);
        }
        VocabResponse response = vocabulariesMapper.toDto(vocabulary.get());
        vocabulariesCacheService.save(word, response);
        return vocabulariesMapper.toDto(vocabulary.get());
    }

    @Override
    public VocabResponse getVocabularyById(Long id) {
        // 1. Lấy cache theo id
        VocabResponse cached = vocabulariesCacheService.getById(id);
        if (cached != null) {
            log.info("[CACHE HIT] vocab id:{}", id);
            return cached;
        }

        // 2. Nếu chưa có cache thì lấy DB
        Vocabularies currentVocab =
                vocabulariesRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));

        VocabResponse response = vocabulariesMapper.toDto(currentVocab);

        // 3. Lưu cache lại theo id
        vocabulariesCacheService.saveById(id, response);
        log.info("[CACHE SAVE] vocab id:{}", id);

        return response;
    }

    @Override
    public Page<VocabResponse> getAllVocabulariesByFilter(
            Specification<Vocabularies> spec, Pageable pageable, String filter) {

        String filterKey = (filter != null && !filter.isBlank()) ? filter.trim() : "no-filter";

        // Hash đúng chuỗi filter gốc, không dựa vào spec.toString()
        String filterHash = DigestUtils.md5DigestAsHex(filterKey.getBytes());

        String cacheKey =
                String.format("vocab:page:%s:%d:%d", filterHash, pageable.getPageNumber(), pageable.getPageSize());

        Page<VocabResponse> cached = vocabulariesCacheService.getPage(cacheKey);
        if (cached != null) {
            log.info("[CACHE HIT] key={} (filter='{}')", cacheKey, filterKey);
            return cached;
        }

        Page<Vocabularies> page = vocabulariesRepository.findAll(spec, pageable);
        Page<VocabResponse> responsePage = page.map(vocabulariesMapper::toDto);

        vocabulariesCacheService.savePage(cacheKey, responsePage);
        log.info("[CACHE SAVE] key={} (filter='{}')", cacheKey, filterKey);
        return responsePage;
    }

    @Override
    public String explainVocabulary(String word) {
        String cached = vocabulariesCacheService.getExplain(word);
        Users currentUser = securityUtil.getCurrentUser();

        // Chặn spam: mỗi user chỉ gọi explain 1 lần / 5 giây
        String limitKey = "ai:limit:" + currentUser.getId();
        if (redisHelper.find(limitKey, String.class) != null) {
            log.warn("[AI LIMIT] User {} spam yêu cầu giải thích từ '{}'", currentUser.getUsername(), word);
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }
        redisHelper.save(limitKey, "1", Duration.ofSeconds(5));

        // PREMIUM user: dùng cache nếu có, nếu không thì gọi AI và cache lại
        if (currentUser.getAccountType().equals(AccountType.PREMIUM)) {
            if (cached != null) {
                log.info("[CACHE HIT] Giải nghĩa từ '{}' (PREMIUM user)", word);
                return cached;
            }
            String explain = geminiService.explainWord(word);
            vocabulariesCacheService.saveExplain(word, explain);
            log.info("[CACHE SAVE] Giải nghĩa từ '{}' (PREMIUM user)", word);
            return explain;
        }

        // FREE user: kiểm tra lượt và trừ lượt sử dụng AI
        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateAiQuota(currentUser);
        }

        // Nếu có cache, trả cache (vẫn đã bị trừ lượt)
        if (cached != null) {
            log.info("[CACHE HIT] Giải nghĩa từ '{}' (FREE user, vẫn trừ lượt)", word);
            return cached;
        }

        // Nếu chưa có cache, gọi AI, cache lại và trả về
        String explain = geminiService.explainWord(word);
        vocabulariesCacheService.saveExplain(word, explain);
        log.info("[CACHE SAVE] Giải nghĩa từ '{}' (FREE user)", word);
        return explain;
    }

    @Override
    @Transactional
    public void deleteVocabularyById(Long id) {
        Vocabularies vocabularies =
                vocabulariesRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
        vocabulariesRepository.delete(vocabularies);
        // Xóa cache
        vocabulariesCacheService.delete(vocabularies.getWord());
        vocabulariesCacheService.clearAllPages();
        log.info("[CACHE DELETE] Đã xóa cache từ '{}' và toàn bộ cache page", vocabularies.getWord());
        vocabulariesCacheService.deleteExplain(vocabularies.getWord());
        log.info("[CACHE DELETE] Đã xóa cache explain của từ: {}", vocabularies.getWord());
        vocabulariesCacheService.clearAllSearches();
        // Xóa cache theo id
        vocabulariesCacheService.deleteById(id);
    }
}
