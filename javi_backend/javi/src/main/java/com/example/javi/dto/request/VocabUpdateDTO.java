package com.example.javi.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.WordType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabUpdateDTO {
    @NotBlank(message = "EMPTY_WORD")
    String word;

    String romaji;
    String hiragana;
    String katakana;
    WordType wordType;
    JlptLevel level;

    @NotNull(message = "EMPTY_MEANING")
    List<MeaningRequest> meanings;

    List<Long> topicIds;
}
