package com.example.javi.dto.response;

import java.util.List;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceDialogueResponse {
    private String question;
    private String questionVi;
    private List<Option> options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private String jp;
        private String vi;
    }
}
