import axiosClient from "@/apis/axiosClient";
import type { IBackendRes } from "@/types/backend";

export interface IWordAnalysis {
  word: string;
  isCorrect: boolean;
  phonemeError: string;
}

export interface IVoiceEvaluationResponse {
  score: number;
  accuracyLevel: "EXCELLENT" | "GOOD" | "IMPROVABLE";
  feedback: string;
  wordsAnalysis: IWordAnalysis[];
}

export interface IVoiceChatResponse {
  userSpokenText: string;
  userSpokenTranslation: string;
  pronunciationScore: number;
  pronunciationFeedback: string;
  isGrammarValid: boolean;
  grammarFeedback: string;
  nextAiResponseText: string;
  nextAiResponseTranslation: string;
}

/**
 * Đánh giá phát âm Level 1 & 2 (Đọc theo câu mẫu)
 * Backend: POST /voice/evaluate
 */
export const callEvaluateSimpleVoice = async (audioBlob: Blob, targetText: string) => {
  const formData = new FormData();
  // Đặt tên file là recording.webm hoặc recording.wav tùy blob
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("targetText", targetText);

  return await axiosClient.post<IBackendRes<IVoiceEvaluationResponse>>(`/voice/evaluate`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Đánh giá và trả lời Kaiwa hội thoại Level 3
 * Backend: POST /voice/chat
 */
export const callEvaluateChatVoice = async (audioBlob: Blob, topicName: string, historyJson: string) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("topicName", topicName);
  formData.append("historyJson", historyJson);

  return await axiosClient.post<IBackendRes<IVoiceChatResponse>>(`/voice/chat`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export interface IDialogueOption {
  jp: string;
  vi: string;
}

export interface IVoiceDialogueResponse {
  question: string;
  questionVi: string;
  options: IDialogueOption[];
  isAiGenerated?: boolean;
}

/**
 * Tạo câu hỏi và các phương án hội thoại gợi ý bằng AI cho Level 2
 * Backend: GET /voice/generate-dialogue
 */
export const callGenerateDialogue = async (topicName: string) => {
  return await axiosClient.get<IBackendRes<IVoiceDialogueResponse>>(`/voice/generate-dialogue`, {
    params: { topicName }
  });
};

export default {
  callEvaluateSimpleVoice,
  callEvaluateChatVoice,
  callGenerateDialogue,
};
