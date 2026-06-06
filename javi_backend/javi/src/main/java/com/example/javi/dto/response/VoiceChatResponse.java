package com.example.javi.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceChatResponse {
    private String userSpokenText;
    private String userSpokenTranslation;
    private int pronunciationScore;
    private String pronunciationFeedback;

    @JsonProperty("isGrammarValid")
    private boolean isGrammarValid;

    private String grammarFeedback;
    private String nextAiResponseText;
    private String nextAiResponseTranslation;
}
