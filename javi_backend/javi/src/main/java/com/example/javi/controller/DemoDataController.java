package com.example.javi.controller;

import java.io.InputStream;
import java.util.List;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.javi.dto.response.ApiResponse;
import com.example.javi.entity.*;
import com.example.javi.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/demo-data")
@RequiredArgsConstructor
@Slf4j
public class DemoDataController {

    private final VocabulariesRepository vocabulariesRepository;
    private final KanjiRepository kanjiRepository;
    private final GrammarRepository grammarRepository;

    @GetMapping("/init-basic")
    @PostMapping("/init-basic")
    public ApiResponse<String> initBasicData() {
        log.info("[DEMO DATA] Khởi tạo dữ liệu từ file JSON classpath...");

        try {
            // 1. Đọc dữ liệu từ file JSON trong classpath
            ClassPathResource resource = new ClassPathResource("dict_data.json");
            ObjectMapper mapper = new ObjectMapper();
            
            DictDataWrapper data;
            try (InputStream is = resource.getInputStream()) {
                data = mapper.readValue(is, DictDataWrapper.class);
            }

            if (data == null) {
                return ApiResponse.<String>builder()
                        .code(500)
                        .message("Không thể đọc được dữ liệu từ file dict_data.json")
                        .build();
            }

            // 2. Dọn dẹp dữ liệu cũ
            vocabulariesRepository.deleteAll();
            kanjiRepository.deleteAll();
            grammarRepository.deleteAll();

            // 3. Chuẩn bị lưu Kanji
            List<Kanji> kanjis = data.getKanjis();
            if (kanjis != null && !kanjis.isEmpty()) {
                kanjiRepository.saveAll(kanjis);
            }

            // 4. Chuẩn bị lưu Từ vựng (và thiết lập mối quan hệ 2 chiều cho Meaning)
            List<Vocabularies> vocabs = data.getVocabularies();
            if (vocabs != null && !vocabs.isEmpty()) {
                for (Vocabularies v : vocabs) {
                    if (v.getMeanings() != null) {
                        for (Meaning m : v.getMeanings()) {
                            m.setVocabularies(v);
                        }
                    }
                }
                vocabulariesRepository.saveAll(vocabs);
            }

            // 5. Chuẩn bị lưu Ngữ pháp
            List<Grammar> grammars = data.getGrammars();
            if (grammars != null && !grammars.isEmpty()) {
                grammarRepository.saveAll(grammars);
            }

            int vocabSize = vocabs != null ? vocabs.size() : 0;
            int kanjiSize = kanjis != null ? kanjis.size() : 0;
            int grammarSize = grammars != null ? grammars.size() : 0;

            log.info("[DEMO DATA] Khởi tạo thành công! Tổng cộng: {} từ vựng, {} Kanji, {} ngữ pháp.", vocabSize, kanjiSize, grammarSize);
            
            return ApiResponse.<String>builder()
                    .code(200)
                    .message("Đã nạp dữ liệu từ điển thật thành công! Hãy quay lại trang web tra cứu và lưu từ.")
                    .result("Dữ liệu nạp gồm: " + vocabSize + " từ vựng thật, " + kanjiSize + " chữ Kanji, " + grammarSize + " mẫu ngữ pháp.")
                    .build();

        } catch (Exception e) {
            log.error("[DEMO DATA ERROR] Khởi tạo dữ liệu thất bại: ", e);
            return ApiResponse.<String>builder()
                    .code(500)
                    .message("Khởi tạo dữ liệu thất bại: " + e.getMessage())
                    .build();
        }
    }

    @Getter
    @Setter
    public static class DictDataWrapper {
        private List<Kanji> kanjis;
        private List<Vocabularies> vocabularies;
        private List<Grammar> grammars;
    }
}
