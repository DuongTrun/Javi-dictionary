package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;
import com.example.javi.dto.response.VoiceEvaluationResponse;
import com.example.javi.dto.response.VoiceChatResponse;

import com.example.javi.dto.response.VoiceDialogueResponse;

public interface VoiceService {
    VoiceEvaluationResponse evaluateSimplePronunciation(MultipartFile audioFile, String targetText);
    VoiceChatResponse evaluateChatConversation(MultipartFile audioFile, String topicName, String historyJson);
    VoiceDialogueResponse generateDialogue(String topicName);
}
