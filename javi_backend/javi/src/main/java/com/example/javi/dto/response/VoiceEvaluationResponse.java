package com.example.javi.dto.response;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceEvaluationResponse {
    private int score;
    private String accuracyLevel; // EXCELLENT, GOOD, IMPROVABLE
    private String feedback;
    private List<WordAnalysis> wordsAnalysis;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordAnalysis {
        private String word;
        
        @JsonProperty("isCorrect")
        private boolean isCorrect;
        
        private String phonemeError;
    }
}
