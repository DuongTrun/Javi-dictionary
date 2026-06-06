package com.example.javi.dto.response;

import java.util.List;

import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.WordType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabResponse {
    Long id;
    String word;
    String hiragana;
    String katakana;
    String romaji;
    JlptLevel level;
    WordType wordType;
    List<MeaningDTO> meanings;
    List<KanjiResponse> kanjis;
    List<TopicResponse> topics;
}
