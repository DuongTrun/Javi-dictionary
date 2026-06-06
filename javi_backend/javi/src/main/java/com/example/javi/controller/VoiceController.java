package com.example.javi.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.VoiceChatResponse;
import com.example.javi.dto.response.VoiceEvaluationResponse;
import com.example.javi.service.VoiceService;

import com.example.javi.dto.response.VoiceDialogueResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/voice")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VoiceController {

    VoiceService voiceService;

    @PostMapping(value = "/evaluate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VoiceEvaluationResponse> evaluatePronunciation(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("targetText") String targetText) {
        log.info("[VOICE API] evaluate simple: targetText='{}', size={} bytes", targetText, audioFile.getSize());
        VoiceEvaluationResponse result = voiceService.evaluateSimplePronunciation(audioFile, targetText);
        return ApiResponse.<VoiceEvaluationResponse>builder()
                .message("Đánh giá phát âm thành công")
                .result(result)
                .build();
    }

    @PostMapping(value = "/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<VoiceChatResponse> evaluateChat(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("topicName") String topicName,
            @RequestParam(value = "historyJson", defaultValue = "[]") String historyJson) {
        log.info("[VOICE API] evaluate chat: topicName='{}', historyJson length={}", topicName, historyJson.length());
        VoiceChatResponse result = voiceService.evaluateChatConversation(audioFile, topicName, historyJson);
        return ApiResponse.<VoiceChatResponse>builder()
                .message("Phản hồi hội thoại thành công")
                .result(result)
                .build();
    }

    @GetMapping("/generate-dialogue")
    public ApiResponse<VoiceDialogueResponse> generateDialogue(@RequestParam("topicName") String topicName) {
        log.info("[VOICE API] generate-dialogue: topicName='{}'", topicName);
        VoiceDialogueResponse result = voiceService.generateDialogue(topicName);
        return ApiResponse.<VoiceDialogueResponse>builder()
                .message("Tạo câu hỏi hội thoại thành công")
                .result(result)
                .build();
    }
}
