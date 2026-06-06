import { useState, useRef, useEffect } from "react";
import { Modal, Button, Radio, Typography, Card, Spin, Tooltip, Progress, message, Alert } from "antd";
import confetti from "canvas-confetti";
import {
  PiMicrophoneBold,
  PiStopBold,
  PiXBold,
  PiSpeakerHighBold,
  PiSparkleBold,
  PiChatCenteredTextBold,
  PiArrowRightBold,
} from "react-icons/pi";
import { callEvaluateSimpleVoice, callEvaluateChatVoice, callGenerateDialogue, IVoiceEvaluationResponse, IVoiceDialogueResponse, IDialogueOption } from "@/apis/voiceApi";
import { ITopic, IVocabResponse } from "@/types/backend";

const { Title, Paragraph, Text } = Typography;

interface SpeakingPracticeModalProps {
  visible: boolean;
  onClose: () => void;
  topic: ITopic;
  vocabList: IVocabResponse[];
}

// Dịch vụ phát âm trình duyệt
const playBrowserTTS = (text: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9; // Đọc chậm một chút để dễ nghe
    window.speechSynthesis.speak(utterance);
  } else {
    message.warning("Trình duyệt của bạn không hỗ trợ phát âm (TTS).");
  }
};

// Dữ liệu kịch bản hội thoại Level 2 (Guided Dialogue)
const guidedDialogues: Record<string, IVoiceDialogueResponse[]> = {
  "Du lịch": [
    {
      question: "日本へ旅行に行ったことがありますか？",
      questionVi: "Bạn đã từng đi du lịch Nhật Bản chưa?",
      options: [
        { jp: "はい、日本へ行ったことがあります。", vi: "Vâng, tôi đã từng đi du lịch Nhật Bản." },
        { jp: "いいえ、まだ行ったことがありません。", vi: "Chưa, tôi vẫn chưa đi lần nào." },
        { jp: "いつか桜を見に日本へ行きたいです。", vi: "Một lúc nào đó tôi muốn đi Nhật Bản ngắm hoa anh đào." }
      ]
    },
    {
      question: "旅行でどこに泊まりますか？",
      questionVi: "Bạn thường lưu trú ở đâu khi đi du lịch?",
      options: [
        { jp: "いつもホテルに泊まります。", vi: "Tôi luôn nghỉ lại ở khách sạn." },
        { jp: "日本の伝統的な旅館に泊まりたいです。", vi: "Tôi muốn nghỉ lại ở một nhà trọ truyền thống của Nhật." },
        { jp: "友達の家に泊まります。", vi: "Tôi nghỉ lại ở nhà bạn bè." }
      ]
    }
  ],
  "Công sở": [
    {
      question: "お仕事は何をしていますか？",
      questionVi: "Bạn đang làm công việc gì?",
      options: [
        { jp: "私は会社員です。IT企業で働いています。", vi: "Tôi là nhân viên văn phòng. Tôi làm ở công ty IT." },
        { jp: "私は日本語の翻訳の仕事をしています。", vi: "Tôi đang làm công việc biên dịch tiếng Nhật." },
        { jp: "今は仕事をしていません。学生です。", vi: "Bây giờ tôi chưa đi làm. Tôi là học sinh." }
      ]
    },
    {
      question: "仕事は何時までですか？",
      questionVi: "Công việc của bạn đến mấy giờ?",
      options: [
        { jp: "毎日、午後五時半に仕事が終わります。", vi: "Mỗi ngày, công việc kết thúc vào 5h30 chiều." },
        { jp: "仕事が忙しいので、よく残業します。", vi: "Vì công việc bận rộn nên tôi thường làm tăng ca." },
        { jp: "フレックスタイムなので自由です。", vi: "Vì làm giờ linh hoạt nên tôi tự do." }
      ]
    }
  ],
  "Trường học": [
    {
      question: "日本語の勉強は面白いですか？",
      questionVi: "Học tiếng Nhật có thú vị không?",
      options: [
        { jp: "はい、漢字は難しいですが、面白いです。", vi: "Vâng, chữ Hán tuy khó nhưng rất thú vị." },
        { jp: "いいえ、文法がとても難しいです。", vi: "Không, ngữ pháp rất là khó." },
        { jp: "はい、アニメが好きですから楽しいです。", vi: "Vâng, vì tôi thích anime nên rất vui." }
      ]
    },
    {
      question: "学校の授業は何時に始まりますか？",
      questionVi: "Giờ học ở trường bắt đầu lúc mấy giờ?",
      options: [
        { jp: "午前九時に始まります。", vi: "Bắt đầu lúc 9 giờ sáng." },
        { jp: "毎日遅れずに学校へ行きます。", vi: "Hàng ngày tôi đến trường không đi muộn." },
        { jp: "オンライン授業なので自由です。", vi: "Vì là học online nên giờ giấc tự do." }
      ]
    }
  ],
  "Ăn uống": [
    {
      question: "日本料理の中で何が一番好きですか？",
      questionVi: "Trong các món ăn Nhật Bản, bạn thích nhất món gì?",
      options: [
        { jp: "寿司が一番好きです。新鮮で美味しいです。", vi: "Tôi thích nhất sushi. Nó tươi và ngon." },
        { jp: "ラーメンが好きで, よく食べに行きます。", vi: "Tôi thích mì ramen, thường hay đi ăn." },
        { jp: "すき焼きが食べてみたいです。", vi: "Tôi muốn ăn thử món lẩu sukiyaki." }
      ]
    },
    {
      question: "コーヒーと紅茶、どちらがいいですか？",
      questionVi: "Cà phê và trà, bạn chọn loại nào?",
      options: [
        { jp: "コーヒーをお願いします。砂糖を入れます。", vi: "Cho tôi cà phê. Tôi có bỏ đường." },
        { jp: "冷たい紅茶をお願いします。", vi: "Cho tôi xin trà lạnh." },
        { jp: "お水だけで結構です。", vi: "Tôi chỉ cần nước lọc là được rồi." }
      ]
    }
  ],
  "Giao tiếp hàng ngày": [
    {
      question: "休みの日は何をしますか？",
      questionVi: "Vào ngày nghỉ bạn thường làm gì?",
      options: [
        { jp: "家で映画を見たり、本を読んだりします。", vi: "Tôi xem phim hoặc đọc sách ở nhà." },
        { jp: "公園を散歩したり、買い物をします。", vi: "Tôi đi dạo ở công viên hoặc đi mua sắm." },
        { jp: "友達とカフェでおしゃべりします。", vi: "Tôi tán gẫu với bạn bè ở quán cà phê." }
      ]
    },
    {
      question: "今日はいい天気ですね？",
      questionVi: "Hôm nay thời tiết đẹp nhỉ?",
      options: [
        { jp: "そうですね。とても暖かいですね。", vi: "Đúng thế thật. Thời tiết ấm áp nhỉ." },
        { jp: "はい、散歩に行きたくなりますね。", vi: "Vâng, thời tiết này làm tôi muốn đi dạo." },
        { jp: "いいえ, 午後から雨が降るそうです。", vi: "Không, nghe nói chiều nay trời sẽ mưa." }
      ]
    }
  ]
};

// Helper function to get theme for score feedback
const getScoreFeedbackTheme = (score: number) => {
  if (score >= 85) {
    return {
      bgClass: "bg-emerald-50/70 border-emerald-300 shadow-emerald-100/50 shadow-lg animate-fade-in-up",
      titleColor: "text-emerald-800",
      badge: "Xuất sắc! 🥇",
      emoji: "🎉",
      description: "Phát âm cực kỳ chuẩn xác và tự nhiên như người bản xứ!",
      glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.35)]"
    };
  }
  if (score >= 50) {
    return {
      bgClass: "bg-amber-50/70 border-amber-300 shadow-amber-100/50 shadow-md animate-fade-in-up",
      titleColor: "text-amber-800",
      badge: "Khá tốt 👍",
      emoji: "✨",
      description: "Phát âm rõ ràng, người nghe hoàn toàn có thể hiểu được.",
      glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    };
  }
  return {
    bgClass: "bg-rose-50/70 border-rose-300 shadow-rose-100/50 shadow-md animate-fade-in-up",
    titleColor: "text-rose-800",
    badge: "Cần cố gắng 💪",
    emoji: "📝",
    description: "Có một vài chỗ phát âm chưa chuẩn xác. Hãy nghe lại mẫu và thử lại nhé!",
    glowClass: "shadow-[0_0_15px_rgba(239,68,68,0.2)]"
  };
};

export default function SpeakingPracticeModal({ visible, onClose, topic, vocabList }: SpeakingPracticeModalProps) {
  const [level, setLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // States Level 1
  const [vocabIndex, setVocabIndex] = useState<number>(0);
  const [simpleResult, setSimpleResult] = useState<IVoiceEvaluationResponse | null>(null);

  // States Level 2
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(-1);
  const [guidedResult, setGuidedResult] = useState<IVoiceEvaluationResponse | null>(null);
  const [dynamicDialogues, setDynamicDialogues] = useState<IVoiceDialogueResponse[]>([]);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // States Level 3 (Free Chat)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; translation?: string; score?: number; grammarFeedback?: string; feedback?: string }>>([]);
  const [historyJson, setHistoryJson] = useState<string>("[]");

  // Refs cho ghi âm & Audio Context phân tích sóng âm
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [volumeBar, setVolumeBar] = useState<number>(0); // 0-100 đại diện cho sóng âm

  // Các biến đo khoảng im lặng (Silence detection)
  const silenceStartRef = useRef<number | null>(null);
  const isSilenceDetectionActive = useRef<boolean>(false);

  // Danh sách từ vựng sạch
  const cleanVocabList = vocabList.filter(v => v.word && v.word.trim() !== "");

  // Tự động giải phóng AudioContext khi unmount
  useEffect(() => {
    return () => {
      stopRecordingTimer();
      cancelAnimationFrameRef();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const cancelAnimationFrameRef = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    stopRecordingTimer();
    setRecordingDuration(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const next = prev + 1;
        // Tối đa 15s cho Level 1-2, 20s cho Level 3
        const limit = level === 3 ? 20 : 15;
        if (next >= limit) {
          stopRecordingAndSubmit();
          message.info(`Đã chạm giới hạn ghi âm tối đa ${limit} giây.`);
        }
        return next;
      });
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Khởi động Audio Analyzer để vẽ sóng âm và đo im lặng
  const initAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      isSilenceDetectionActive.current = level === 3; // Chỉ kích hoạt auto-stop ở Level 3 (Free chat)
      silenceStartRef.current = null;

      const draw = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Tính volume trung bình
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const averageVolume = total / bufferLength;
        setVolumeBar(Math.min(100, Math.floor((averageVolume / 128) * 100)));

        // Phát hiện im lặng (chỉ áp dụng cho Level 3)
        if (isSilenceDetectionActive.current) {
          const silenceThreshold = 8; // Ngưỡng biên độ cực nhỏ để coi là im lặng
          if (averageVolume < silenceThreshold) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else {
              const elapsed = Date.now() - silenceStartRef.current;
              if (elapsed > 2800) { // Im lặng quá 2.8s -> tự động dừng
                isSilenceDetectionActive.current = false;
                stopRecordingAndSubmit();
                message.info("Tự động ngắt ghi âm do phát hiện im lặng.");
              }
            }
          } else {
            silenceStartRef.current = null;
          }
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.error("Lỗi phân tích sóng âm:", e);
    }
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    if (level === 2 && selectedOptionIdx === -1) {
      message.warning("Vui lòng chọn một câu gợi ý trước khi nói!");
      return;
    }

    // Reset previous evaluation results when starting new recording
    if (level === 1) setSimpleResult(null);
    if (level === 2) setGuidedResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());

        // Kiểm tra xem có nói gì không (Chống spam file rác)
        if (audioBlob.size < 2000) {
          message.warning("Ghi âm quá ngắn hoặc không có âm thanh. Vui lòng nói lại!");
          return;
        }
        
        await submitAudio(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecording(true);
      startRecordingTimer();
      initAudioAnalyzer(stream);

    } catch (e) {
      console.error("Lỗi kết nối Micro:", e);
      message.error("Không thể kết nối Micro. Hãy chắc chắn bạn đã cấp quyền sử dụng Micro!");
    }
  };

  // Dừng ghi âm và nộp bài
  const stopRecordingAndSubmit = () => {
    stopRecordingTimer();
    cancelAnimationFrameRef();
    setVolumeBar(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Nộp file audio lên backend
  const submitAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      if (level === 1) {
        const targetText = cleanVocabList[vocabIndex]?.word || "";
        const res = await callEvaluateSimpleVoice(audioBlob, targetText);
        if (res.data && res.data.result) {
          setSimpleResult(res.data.result);
          if (res.data.result.score >= 85) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            message.success(`Tuyệt vời! Bạn đạt ${res.data.result.score} điểm.`);
          } else if (res.data.result.score >= 80) {
            message.success(`Tuyệt vời! Bạn đạt ${res.data.result.score} điểm.`);
          } else {
            message.info(`Bạn đạt ${res.data.result.score} điểm. Hãy thử cải thiện lại nhé.`);
          }
        }
      } else if (level === 2) {
        const staticDialogues = guidedDialogues[topic.nameVi] || [];
        const allDialogues = [...staticDialogues, ...dynamicDialogues];
        const script = allDialogues[dialogueIndex];
        const targetText = script?.options[selectedOptionIdx]?.jp || "";
        const res = await callEvaluateSimpleVoice(audioBlob, targetText);
        if (res.data && res.data.result) {
          setGuidedResult(res.data.result);
          if (res.data.result.score >= 85) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            message.success(`Tuyệt vời! Bạn đạt ${res.data.result.score} điểm.`);
          } else if (res.data.result.score >= 80) {
            message.success(`Tuyệt vời! Bạn đạt ${res.data.result.score} điểm.`);
          } else {
            message.info(`Bạn đạt ${res.data.result.score} điểm. Hãy thử cải thiện lại nhé.`);
          }
        }
      } else if (level === 3) {
        const res = await callEvaluateChatVoice(audioBlob, topic.nameVi, historyJson);
        if (res.data && res.data.result) {
          const chatRes = res.data.result;
          
          // Tạo tin nhắn mới của User & AI
          const newUserMsg = {
            sender: "user" as const,
            text: chatRes.userSpokenText || "(Không nhận diện được giọng nói)",
            translation: chatRes.userSpokenTranslation,
            score: chatRes.pronunciationScore,
            grammarFeedback: chatRes.grammarFeedback,
            feedback: chatRes.pronunciationFeedback
          };

          if (chatRes.pronunciationScore >= 85) {
            confetti({
              particleCount: 65,
              spread: 50,
              origin: { y: 0.75 }
            });
          }

          const newAiMsg = {
            sender: "ai" as const,
            text: chatRes.nextAiResponseText,
            translation: chatRes.nextAiResponseTranslation
          };

          const updatedMessages = [...chatMessages, newUserMsg, newAiMsg];
          setChatMessages(updatedMessages);

          // Cập nhật history JSON gửi lên lần sau
          const simpleHistory = updatedMessages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }));
          setHistoryJson(JSON.stringify(simpleHistory));

          // Phát âm AI tự động phản hồi
          playBrowserTTS(chatRes.nextAiResponseText);
        }
      }
    } catch (e) {
      console.error("Lỗi gửi chấm điểm giọng nói:", e);
      message.error("Có lỗi xảy ra khi chấm điểm. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Chuyển từ vựng tiếp theo ở Level 1
  const handleNextVocab = () => {
    if (vocabIndex < cleanVocabList.length - 1) {
      setVocabIndex(prev => prev + 1);
      setSimpleResult(null);
    } else {
      message.success("Chúc mừng! Bạn đã hoàn thành luyện nói các từ vựng của chủ đề này!");
    }
  };

  // Reset / Thử lại Level 1
  const handleRetryVocab = () => {
    setSimpleResult(null);
  };

  // Chuyển sang hội thoại gợi ý tiếp theo (Level 2)
  const handleNextDialogue = () => {
    const staticDialogues = guidedDialogues[topic.nameVi] || [];
    const allDialogues = [...staticDialogues, ...dynamicDialogues];
    if (dialogueIndex < allDialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
      setSelectedOptionIdx(-1);
      setGuidedResult(null);
    } else {
      message.success("Bạn đã hoàn thành các câu hội thoại gợi ý!");
    }
  };

  // Tạo hội thoại mới bằng AI cho Level 2
  const handleGenerateAiDialogue = async () => {
    setAiGenerating(true);
    try {
      const res = await callGenerateDialogue(topic.nameVi);
      if (res.data && res.data.result) {
        const newDialogue: any = {
          ...res.data.result,
          isAiGenerated: true
        };
        const staticDialogues = guidedDialogues[topic.nameVi] || [];
        const currentLength = staticDialogues.length + dynamicDialogues.length;
        
        setDynamicDialogues(prev => [...prev, newDialogue]);
        setDialogueIndex(currentLength);
        setSelectedOptionIdx(-1);
        setGuidedResult(null);
        message.success("Đã sinh thành công một câu hỏi hội thoại mới bằng AI!");
      }
    } catch (e) {
      console.error("Lỗi sinh câu hỏi AI:", e);
      message.error("Có lỗi xảy ra khi tạo hội thoại bằng AI. Vui lòng thử lại!");
    } finally {
      setAiGenerating(false);
    }
  };

  // Reset Level 3
  const handleResetChat = () => {
    setChatMessages([]);
    setHistoryJson("[]");
    // Tạo tin nhắn chào đầu tiên của AI
    const welcomeText = `${topic.nameJa}へようこそ！一緒に話しましょう。(Chào mừng bạn đến với chủ đề ${topic.nameVi}! Chúng ta cùng trò chuyện nhé.)`;
    setChatMessages([
      {
        sender: "ai",
        text: welcomeText,
        translation: `Chào mừng bạn đến với chủ đề ${topic.nameVi}! Chúng ta cùng trò chuyện nhé.`
      }
    ]);
  };

  // Gọi TTS ban đầu của AI ở Level 3 khi vừa bật
  useEffect(() => {
    if (level === 3 && chatMessages.length === 0) {
      handleResetChat();
    }
  }, [level]);

  // Sinh màu động cho điểm số
  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a"; // xanh lá
    if (score >= 50) return "#faad14"; // vàng
    return "#f5222d"; // đỏ
  };

  // Render bôi đỏ từ sai trong câu mẫu
  const renderSimpleAnalysis = (result: IVoiceEvaluationResponse) => {
    if (!result.wordsAnalysis || result.wordsAnalysis.length === 0) {
      return <Text className="text-xl font-bold text-gray-800">{cleanVocabList[vocabIndex]?.word}</Text>;
    }

    return (
      <div className="flex flex-wrap gap-2 justify-center py-4">
        {result.wordsAnalysis.map((item, idx) => (
          <Tooltip key={idx} title={item.isCorrect ? "Phát âm chính xác!" : item.phonemeError || "Sai phát âm"}>
            <span
              className={`text-2xl font-bold font-mplus px-2.5 py-1 rounded-xl cursor-pointer transition-all border border-solid ${
                item.isCorrect
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-rose-700 bg-rose-50 border-rose-200 hover:scale-105"
              }`}
            >
              {item.word}
            </span>
          </Tooltip>
        ))}
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      title={null}
      destroyOnClose
      closeIcon={<PiXBold className="text-xl text-gray-500 hover:text-red-500" />}
      className="speaking-practice-modal"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex flex-col h-[85vh] bg-slate-50 rounded-2xl overflow-hidden font-sans">
        
        {/* BANNER HEADER */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shadow-md">
          <div>
            <Title level={3} className="m-0 text-white font-bold flex items-center gap-2">
              🎙️ AI Voice Coach
            </Title>
            <Paragraph className="m-0 text-blue-100 text-sm mt-1">
              Chủ đề: <span className="font-semibold text-white">{topic.nameJa} — {topic.nameVi}</span>
            </Paragraph>
          </div>
          
          <Radio.Group
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setSimpleResult(null);
              setGuidedResult(null);
            }}
            optionType="button"
            buttonStyle="solid"
            className="speaking-level-selector"
          >
            <Radio.Button value={1}>Cấp 1: Đọc theo mẫu</Radio.Button>
            <Radio.Button value={2}>Cấp 2: Gợi ý hội thoại</Radio.Button>
            <Radio.Button value={3}>Cấp 3: Kaiwa tự do</Radio.Button>
          </Radio.Group>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-between">
          
          {/* LEVEL 1: ĐỌC THEO MẪU */}
          {level === 1 && (
            <div className="flex-1 flex flex-col justify-between">
              {cleanVocabList.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  Chủ đề này chưa được gán từ vựng nào để luyện tập.
                </div>
              ) : (
                <>
                  {/* Khung Hiển thị Từ mẫu */}
                  <div className="text-center my-auto">
                    <Text type="secondary" className="text-xs tracking-widest uppercase font-bold text-blue-500 block mb-2">
                      Câu/Từ mẫu #{vocabIndex + 1}
                    </Text>
                    
                    {/* Bôi đỏ/xanh kết quả phân tích nếu có */}
                    {simpleResult ? (
                      renderSimpleAnalysis(simpleResult)
                    ) : loading ? (
                      <div className="relative inline-block my-2 overflow-hidden px-4">
                        <Title level={1} className="m-0 font-bold font-mplus text-gray-300 text-5xl select-none filter blur-[0.5px]">
                          {cleanVocabList[vocabIndex]?.word}
                        </Title>
                        {/* Wave scanner line */}
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-laser-scan"></div>
                      </div>
                    ) : (
                      <Title level={1} className="m-0 font-bold font-mplus text-gray-800 text-5xl hover:scale-102 transition-transform duration-200">
                        {cleanVocabList[vocabIndex]?.word}
                      </Title>
                    )}

                    <div className="mt-4 flex flex-col gap-1 items-center">
                      {cleanVocabList[vocabIndex]?.hiragana && (
                        <Text className="text-gray-500 text-lg font-medium">
                          りょう: {cleanVocabList[vocabIndex].hiragana}
                        </Text>
                      )}
                      <Text type="secondary" className="text-base italic max-w-lg">
                        Ý nghĩa: {cleanVocabList[vocabIndex]?.meanings?.[0]?.meaningVn?.replace(/<[^>]*>/g, "") || "—"}
                      </Text>
                    </div>

                    <div className="mt-5">
                      <Button
                        shape="circle"
                        type="dashed"
                        disabled={loading}
                        icon={<PiSpeakerHighBold className="text-xl" />}
                        onClick={() => playBrowserTTS(cleanVocabList[vocabIndex]?.word)}
                        className="hover:border-blue-500 hover:text-blue-500 flex items-center justify-center mx-auto"
                        title="Nghe phát âm mẫu"
                      />
                    </div>
                  </div>

                  {/* Vùng trạng thái đang chấm điểm (Loading) */}
                  {loading && (
                    <Card className="border border-solid border-blue-200 rounded-2xl shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 mb-6 animate-pulse-glow">
                      <div className="flex items-center gap-6">
                        <div className="relative flex items-center justify-center w-16 h-16 bg-white/80 rounded-full shadow-inner">
                          <Spin size="default" />
                          <div className="absolute inset-0 border border-solid border-blue-400 rounded-full animate-ping opacity-25"></div>
                        </div>
                        <div className="flex-1">
                          <Title level={5} className="m-0 font-bold text-blue-800 flex items-center gap-2">
                            <span className="animate-bounce">🤖</span> AI đang phân tích phát âm...
                          </Title>
                          <Paragraph className="m-0 mt-1 text-blue-600 text-sm">
                            Đang phân tích độ chuẩn xác, ngữ điệu và phát âm từng âm tiết. Vui lòng đợi trong giây lát!
                          </Paragraph>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Vùng kết quả điểm số */}
                  {simpleResult && (() => {
                    const theme = getScoreFeedbackTheme(simpleResult.score);
                    return (
                      <Card className={`border border-solid rounded-2xl p-4 mb-6 transition-all duration-300 ${theme.bgClass} ${theme.glowClass} relative overflow-hidden`}>
                        {/* Decorative particles for EXCELLENT score */}
                        {simpleResult.score >= 85 && (
                          <div className="absolute inset-0 pointer-events-none">
                            <span className="absolute text-lg animate-float-particle-1" style={{ left: '10%', top: '20%' }}>🎉</span>
                            <span className="absolute text-lg animate-float-particle-2" style={{ right: '15%', top: '30%' }}>✨</span>
                            <span className="absolute text-lg animate-float-particle-3" style={{ left: '25%', bottom: '15%' }}>🌸</span>
                            <span className="absolute text-lg animate-float-particle-4" style={{ right: '8%', bottom: '20%' }}>🌟</span>
                          </div>
                        )}
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="relative">
                            <Progress
                              type="circle"
                              percent={simpleResult.score}
                              strokeColor={getScoreColor(simpleResult.score)}
                              width={80}
                              className="font-bold"
                            />
                            {simpleResult.score >= 85 && (
                              <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 shadow-md animate-bounce">
                                <PiSparkleBold className="text-sm" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Title level={5} className={`m-0 font-bold ${theme.titleColor} flex items-center gap-2 text-lg`}>
                              {theme.badge} <span className="text-xl">{theme.emoji}</span>
                            </Title>
                            <Paragraph className="m-0 mt-1.5 text-gray-700 text-sm leading-relaxed">
                              {simpleResult.feedback || theme.description}
                            </Paragraph>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Nút bấm Ghi âm / Thao tác */}
                  <div className="flex flex-col items-center gap-4 mt-6">
                    {/* Visualizer Sóng âm ảo khi ghi âm */}
                    {isRecording && (
                      <div className="flex items-center gap-1.5 h-6">
                        <span className="text-xs text-red-500 font-bold animate-pulse">REC {recordingDuration}s</span>
                        <div className="flex items-end gap-0.5 h-full">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-red-500 w-1 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(10, Math.min(100, volumeBar * (0.5 + Math.random() * 0.5)))}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {simpleResult && (
                        <Button size="large" disabled={loading} icon={<PiXBold />} onClick={handleRetryVocab}>
                          Đọc lại
                        </Button>
                      )}
                      
                      {/* NÚT CLICK TO TOGGLE */}
                      <Button
                        type="primary"
                        shape="round"
                        size="large"
                        danger={isRecording}
                        loading={loading}
                        disabled={loading}
                        icon={isRecording ? <PiStopBold /> : <PiMicrophoneBold />}
                        onClick={isRecording ? stopRecordingAndSubmit : startRecording}
                        className={`speaking-mic-btn h-14 px-8 font-semibold shadow-md transform active:scale-95 transition-all flex items-center gap-2 ${
                          isRecording ? "animate-pulse bg-red-600 border-red-600" : "bg-blue-600 border-blue-600"
                        }`}
                      >
                        {loading ? "AI đang chấm điểm..." : isRecording ? "Bấm để Nộp bài" : "Bắt đầu nói"}
                      </Button>

                      {simpleResult && (
                        <Button
                          type="primary"
                          size="large"
                          icon={<PiArrowRightBold />}
                          onClick={handleNextVocab}
                          className="bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700"
                        >
                          Từ tiếp theo
                        </Button>
                      )}
                    </div>
                    <Text type="secondary" className="text-xs">
                      Mẹo: Bấm một lần để bắt đầu nói, đọc to rõ ràng. Bấm lại để nộp bài.
                    </Text>
                  </div>
                </>
              )}
            </div>
          )}

          {/* LEVEL 2: GỢI Ý HỘI THOẠI */}
          {level === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              {(() => {
                const staticDialogues = guidedDialogues[topic.nameVi] || [];
                const allDialogues = [...staticDialogues, ...dynamicDialogues];
                const currentScript = allDialogues[dialogueIndex];

                if (!currentScript) {
                  return (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center gap-4">
                      <p className="m-0 font-medium text-gray-500">Chủ đề này chưa có kịch bản hội thoại mặc định.</p>
                      <Button
                        type="primary"
                        icon={<PiSparkleBold />}
                        loading={aiGenerating}
                        onClick={handleGenerateAiDialogue}
                        className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 flex items-center gap-1.5 shadow-sm"
                      >
                        Tạo hội thoại mới bằng AI
                      </Button>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Header thông tin hội thoại */}
                    <div className="flex justify-between items-center mb-4">
                      <Text type="secondary" className="text-xs tracking-widest uppercase font-bold text-indigo-600">
                        Hội thoại #{dialogueIndex + 1} {currentScript.isAiGenerated ? " (Tạo bởi AI 🤖)" : " (Mặc định)"}
                      </Text>
                      <Button
                        type="dashed"
                        icon={<PiSparkleBold className="text-indigo-500 animate-pulse" />}
                        onClick={handleGenerateAiDialogue}
                        loading={aiGenerating}
                        className="hover:border-indigo-500 hover:text-indigo-500 flex items-center gap-1 text-xs px-2.5 py-1.5 h-auto"
                      >
                        Tạo câu mới bằng AI
                      </Button>
                    </div>
                    {/* Phần hội thoại AI Hỏi */}
                    <div className="mb-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 border border-solid border-indigo-200 rounded-2xl shadow-sm text-indigo-600 font-bold text-sm">
                          AI
                        </div>
                        <div className="bg-white border border-solid border-gray-200 rounded-2xl p-4 shadow-sm max-w-xl">
                          <Title level={4} className="m-0 font-bold text-gray-800 font-mplus flex items-center gap-2">
                            {currentScript.question}
                            <Button
                              shape="circle"
                              size="small"
                              type="text"
                              icon={<PiSpeakerHighBold />}
                              onClick={() => playBrowserTTS(currentScript.question)}
                            />
                          </Title>
                          <Paragraph className="m-0 mt-2 text-gray-400 text-sm italic">
                            Dịch: {currentScript.questionVi}
                          </Paragraph>
                        </div>
                      </div>
                    </div>

                    {/* Phần User chọn Đáp án để nói */}
                    <div className="space-y-3 mb-6">
                      <Text type="secondary" className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                        Chọn 1 phương án bên dưới và Đọc to lên:
                      </Text>
                      {currentScript.options.map((opt: IDialogueOption, idx: number) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (loading) return; // Không cho phép chọn khi đang chấm điểm
                              setSelectedOptionIdx(idx);
                              setGuidedResult(null);
                            }}
                            className={`p-4 rounded-2xl border border-solid transition-all cursor-pointer flex justify-between items-center relative overflow-hidden ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-400 shadow-sm animate-pulse-glow-subtle"
                                : "bg-white border-gray-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex-1 z-10">
                              <Text className={`text-base font-semibold font-mplus ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
                                {opt.jp}
                              </Text>
                              <div className="text-xs text-gray-400 mt-1 italic">
                                Nghĩa: {opt.vi}
                              </div>
                            </div>
                            {/* Đường quét laser quét qua câu được chọn */}
                            {loading && isSelected && (
                              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-laser-scan"></div>
                            )}
                            <Button
                              shape="circle"
                              size="small"
                              type="text"
                              disabled={loading}
                              icon={<PiSpeakerHighBold />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptionIdx(idx);
                                setGuidedResult(null);
                                playBrowserTTS(opt.jp);
                              }}
                              className="hover:text-indigo-600 z-10"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Hiển thị phân tích chữ lỗi hoặc trạng thái Loading */}
                    {loading ? (
                      <Card className="border border-solid border-indigo-200 rounded-2xl shadow-md bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4 mb-6 animate-pulse-glow">
                        <div className="flex items-center gap-6">
                          <div className="relative flex items-center justify-center w-16 h-16 bg-white/80 rounded-full shadow-inner">
                            <Spin size="default" />
                            <div className="absolute inset-0 border border-solid border-indigo-400 rounded-full animate-ping opacity-25"></div>
                          </div>
                          <div className="flex-1">
                            <Title level={5} className="m-0 font-bold text-indigo-800 flex items-center gap-2">
                              <span className="animate-bounce">🤖</span> AI đang chấm điểm đối thoại...
                            </Title>
                            <Paragraph className="m-0 mt-1 text-indigo-600 text-sm">
                              Hệ thống đang chấm điểm phát âm câu hội thoại dựa trên ngữ cảnh chủ đề.
                            </Paragraph>
                          </div>
                        </div>
                      </Card>
                    ) : guidedResult ? (() => {
                      const theme = getScoreFeedbackTheme(guidedResult.score);
                      return (
                        <Card className={`border border-solid rounded-2xl p-4 mb-6 transition-all duration-300 ${theme.bgClass} ${theme.glowClass} relative overflow-hidden`}>
                          {/* Decorative particles for EXCELLENT score */}
                          {guidedResult.score >= 85 && (
                            <div className="absolute inset-0 pointer-events-none">
                              <span className="absolute text-lg animate-float-particle-1" style={{ left: '8%', top: '15%' }}>🎉</span>
                              <span className="absolute text-lg animate-float-particle-2" style={{ right: '12%', top: '25%' }}>✨</span>
                              <span className="absolute text-lg animate-float-particle-3" style={{ left: '20%', bottom: '10%' }}>🌸</span>
                              <span className="absolute text-lg animate-float-particle-4" style={{ right: '5%', bottom: '15%' }}>🌟</span>
                            </div>
                          )}
                          <div className="flex items-center gap-6 mb-4 relative z-10">
                            <div className="relative">
                              <Progress
                                type="circle"
                                percent={guidedResult.score}
                                strokeColor={getScoreColor(guidedResult.score)}
                                width={75}
                              />
                              {guidedResult.score >= 85 && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 shadow-md animate-bounce">
                                  <PiSparkleBold className="text-sm" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <Title level={5} className={`m-0 font-bold ${theme.titleColor} flex items-center gap-2 text-lg`}>
                                Độ chuẩn xác: {guidedResult.score}% ({theme.badge}) <span className="text-xl">{theme.emoji}</span>
                              </Title>
                              <Paragraph className="m-0 mt-1.5 text-gray-700 text-sm leading-relaxed">
                                {guidedResult.feedback || theme.description}
                              </Paragraph>
                            </div>
                          </div>

                          {/* Highlight từ sai */}
                          <div className="flex flex-wrap gap-1.5 justify-center bg-white/85 p-3 rounded-xl border border-solid border-gray-100 relative z-10">
                            {guidedResult.wordsAnalysis && guidedResult.wordsAnalysis.length > 0 ? (
                              guidedResult.wordsAnalysis.map((item, idx) => (
                                <Tooltip key={idx} title={item.isCorrect ? "Đúng!" : item.phonemeError || "Lỗi phát âm"}>
                                  <span
                                    className={`text-lg font-bold font-mplus px-2 py-0.5 rounded-lg border border-solid transition-all duration-200 ${
                                      item.isCorrect
                                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                        : "text-rose-700 bg-rose-50 border-rose-200 hover:scale-105"
                                    }`}
                                  >
                                    {item.word}
                                  </span>
                                </Tooltip>
                              ))
                            ) : (
                              <Text className="font-mplus font-bold text-gray-800">{currentScript.options[selectedOptionIdx]?.jp}</Text>
                            )}
                          </div>
                        </Card>
                      );
                    })() : null}

                    {/* Mic hold to talk */}
                    <div className="flex flex-col items-center gap-4 mt-6">
                      {isRecording && (
                        <div className="flex items-center gap-1.5 h-6">
                          <span className="text-xs text-red-500 font-bold animate-pulse">REC {recordingDuration}s</span>
                          <div className="flex items-end gap-0.5 h-full">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="bg-red-500 w-1 rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(10, Math.min(100, volumeBar * (0.5 + Math.random() * 0.5)))}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {guidedResult && (
                          <Button size="large" disabled={loading} icon={<PiXBold />} onClick={() => setGuidedResult(null)}>
                            Nói lại
                          </Button>
                        )}
                        
                        <Button
                          type="primary"
                          shape="round"
                          size="large"
                          danger={isRecording}
                          loading={loading}
                          icon={isRecording ? <PiStopBold /> : <PiMicrophoneBold />}
                          onClick={isRecording ? stopRecordingAndSubmit : startRecording}
                          disabled={loading}
                          className={`speaking-mic-btn h-14 px-8 font-semibold shadow-md transform active:scale-95 transition-all flex items-center gap-2 ${
                            selectedOptionIdx === -1
                              ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 hover:border-gray-300"
                              : isRecording
                              ? "animate-pulse bg-red-600 border-red-600"
                              : "bg-indigo-600 border-indigo-600"
                          }`}
                        >
                          {loading ? "AI đang chấm điểm..." : isRecording ? "Bấm để Nộp bài" : "Bắt đầu nói"}
                        </Button>

                        {guidedResult && (
                          <Button
                            type="primary"
                            size="large"
                            icon={<PiArrowRightBold />}
                            onClick={handleNextDialogue}
                            className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                          >
                            Câu tiếp theo
                          </Button>
                        )}
                      </div>
                      <Text type="secondary" className="text-xs">
                        Chọn đáp án gợi ý ➔ Bấm nút Micro để đọc ➔ Bấm lại lần nữa để gửi.
                      </Text>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* LEVEL 3: KAIWA TỰ DO */}
          {level === 3 && (
            <div className="flex-1 flex flex-col h-full justify-between">
              
              {/* Cửa sổ chat cuộn */}
              <div className="flex-1 min-h-[300px] overflow-y-auto bg-white border border-solid border-gray-200 rounded-2xl p-4 shadow-inner mb-6 space-y-4 flex flex-col">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 max-w-[85%] ${
                      msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    {/* Avatar đại diện */}
                    <div
                      className={`p-2 rounded-xl text-xs font-bold shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-50 border border-solid border-emerald-200 text-emerald-600"
                      }`}
                    >
                      {msg.sender === "user" ? "ME" : "AI"}
                    </div>

                    <div className="flex flex-col">
                      <div
                        className={`rounded-2xl p-4 shadow-sm border border-solid ${
                          msg.sender === "user"
                            ? "bg-blue-50 border-blue-100 text-gray-800"
                            : "bg-emerald-50/50 border-emerald-100 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mplus font-bold text-base">{msg.text}</span>
                          <Button
                            shape="circle"
                            size="small"
                            type="text"
                            icon={<PiSpeakerHighBold />}
                            onClick={() => playBrowserTTS(msg.text)}
                          />
                        </div>

                        {msg.translation && (
                          <div className="text-xs text-gray-400 italic mt-1.5 border-t border-dashed border-gray-200/60 pt-1">
                            Dịch: {msg.translation}
                          </div>
                        )}
                      </div>

                      {/* Phản hồi điểm số & ngữ pháp nếu có (Chỉ tin nhắn của User) */}
                      {msg.sender === "user" && msg.score !== undefined && (
                        <div className="mt-2 pl-2 space-y-1.5 animate-fade-in-up">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm" style={{ backgroundColor: getScoreColor(msg.score) }}>
                              {msg.score >= 85 ? "🌟" : "🎙️"} Phát âm: {msg.score}đ
                            </span>
                            {msg.feedback && (
                              <span className="text-xs text-gray-600 italic font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                {msg.feedback}
                              </span>
                            )}
                          </div>

                          {msg.grammarFeedback && (
                            <Alert
                              type="info"
                              showIcon
                              icon={<PiSparkleBold className="text-blue-500 animate-pulse" />}
                              message={
                                <div className="text-[11px] text-gray-700 leading-relaxed font-medium">
                                  <span className="font-bold text-blue-600">Nhận xét ngữ pháp: </span>
                                  {msg.grammarFeedback}
                                </div>
                              }
                              className="py-1.5 px-3 rounded-lg border-blue-100 bg-blue-50/50 shadow-sm"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="self-start flex items-center gap-3 animate-fade-in-up">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-solid border-emerald-200 text-emerald-600 text-xs font-bold animate-pulse">
                      AI
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 border border-solid border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-pulse-glow-subtle">
                      <Spin size="small" />
                      <Text type="secondary" italic className="text-xs font-medium text-emerald-800">AI đang nghe và chuẩn bị trả lời...</Text>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút thao tác ghi âm dạng click toggle */}
              <div className="flex flex-col items-center gap-4">
                {isRecording && (
                  <div className="flex items-center gap-1.5 h-6">
                    <span className="text-xs text-red-500 font-bold animate-pulse">ĐANG THU ÂM KAIWA ({recordingDuration}s)</span>
                    <div className="flex items-end gap-0.5 h-full">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-red-500 w-1 rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(10, Math.min(100, volumeBar * (0.5 + Math.random() * 0.5)))}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button size="large" type="dashed" danger icon={<PiChatCenteredTextBold />} onClick={handleResetChat}>
                    Làm mới đoạn chat
                  </Button>

                  {/* NÚT CLICK TO TOGGLE */}
                  <Button
                    type="primary"
                    shape="round"
                    size="large"
                    danger={isRecording}
                    loading={loading}
                    icon={isRecording ? <PiStopBold /> : <PiMicrophoneBold />}
                    onClick={isRecording ? stopRecordingAndSubmit : startRecording}
                    disabled={loading}
                    className={`speaking-mic-btn h-14 px-10 font-semibold shadow-md transform active:scale-95 transition-all flex items-center gap-2 ${
                      isRecording ? "bg-red-600 border-red-600" : "bg-emerald-600 border-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {loading ? "AI đang trả lời..." : isRecording ? "Bấm để Nộp bài" : "Bắt đầu nói Kaiwa"}
                  </Button>
                </div>
                
                <Text type="secondary" className="text-xs">
                  Mẹo: Bấm một lần để bắt đầu nói, nói tự do bằng tiếng Nhật. Bấm lại để nộp (hoặc hệ thống tự ngắt sau 3 giây im lặng).
                </Text>
              </div>

            </div>
          )}

        </div>
      </div>
      {/* Custom Styles for animations and glow effects */}
      <style>{`
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.008); }
        }
        @keyframes pulse-glow-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.003); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-particle-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
          50% { transform: translate(-8px, -15px) rotate(12deg); opacity: 1; }
        }
        @keyframes float-particle-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
          50% { transform: translate(10px, -18px) rotate(-15deg); opacity: 1; }
        }
        @keyframes float-particle-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
          50% { transform: translate(-12px, -8px) rotate(-8deg); opacity: 0.9; }
        }
        @keyframes float-particle-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
          50% { transform: translate(8px, -12px) rotate(22deg); opacity: 0.9; }
        }
        .animate-laser-scan {
          position: absolute;
          animation: laser-scan 2.2s infinite ease-in-out;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        .animate-pulse-glow-subtle {
          animation: pulse-glow-subtle 2s infinite ease-in-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-particle-1 {
          animation: float-particle-1 3s infinite ease-in-out;
        }
        .animate-float-particle-2 {
          animation: float-particle-2 3.5s infinite ease-in-out;
        }
        .animate-float-particle-3 {
          animation: float-particle-3 4s infinite ease-in-out;
        }
        .animate-float-particle-4 {
          animation: float-particle-4 4.5s infinite ease-in-out;
        }
      `}</style>
    </Modal>
  );
}
