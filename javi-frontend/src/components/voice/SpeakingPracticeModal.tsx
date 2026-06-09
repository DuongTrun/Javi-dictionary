import { useState, useRef, useEffect } from "react";
import { Modal, Typography, Spin, Tooltip, message } from "antd";
import confetti from "canvas-confetti";
import { callEvaluateSimpleVoice, callEvaluateChatVoice, callGenerateDialogue, IVoiceEvaluationResponse, IVoiceDialogueResponse, IDialogueOption } from "@/apis/voiceApi";
import { ITopic, IVocabResponse } from "@/types/backend";
import { toRomaji } from "wanakana";

const { Text } = Typography;

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



// Hàm lọc bỏ âm Hán-Việt viết hoa ở đầu nghĩa tiếng Việt
const cleanHanhVietMeaning = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/<[^>]*>/g, "").trim();
  const regex = /^•?\s*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐẰẮẲẴẶẦẤẨẪẬỀẾỂỄỆỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\s]{3,})\s+(?=\d+\.|\d|•|\(|[a-zà-ỹ])/;
  const match = cleaned.match(regex);
  if (match) {
    cleaned = cleaned.substring(match[0].length).trim();
  }
  cleaned = cleaned.replace(/^•\s*/, "");
  return cleaned;
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
      closeIcon={null}
      className="speaking-practice-modal"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex flex-col h-[85vh] sm:h-[80vh] md:h-[85vh] bg-surface rounded-2xl overflow-hidden font-body-md text-on-surface antialiased">
        
        {/* BANNER HEADER */}
        <header className="bg-gradient-to-r from-primary to-on-primary-fixed-variant text-on-primary px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
            <h1 className="font-headline-md text-headline-md text-white m-0">AI Voice Coach</h1>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white border-none bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        
        {/* TABS LEVEL SELECTOR */}
        <div className="px-margin-mobile md:px-margin-desktop py-stack-md shrink-0 flex justify-center bg-surface border-b border-outline-variant/20 shadow-sm">
          <div className="bg-surface-container-high rounded-lg p-1 flex shadow-sm max-w-fit gap-1">
            {[
              { key: 1, label: "Level 1: Beginner" },
              { key: 2, label: "Level 2: Intermediate" },
              { key: 3, label: "Level 3: Native" },
            ].map((t) => {
              const isActive = level === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setLevel(t.key);
                    setSimpleResult(null);
                    setGuidedResult(null);
                  }}
                  className={`px-5 py-2 rounded-md font-label-md text-label-md transition-all border-none cursor-pointer ${
                    isActive
                      ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                      : "bg-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col justify-between">
          
          {/* LEVEL 1: ĐỌC THEO MẪU */}
          {level === 1 && (
            <div className="flex-1 min-h-0 flex flex-col justify-between">
              {cleanVocabList.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  Chủ đề này chưa được gán từ vựng nào để luyện tập.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Khung Hiển thị Từ mẫu */}
                  <section className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-sm border border-outline-variant/10 text-center flex flex-col items-center gap-stack-md">
                    <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block">Target Sentence</span>
                    
                    <div className="font-japanese-display text-japanese-display text-on-surface mt-2">
                      {simpleResult ? (
                        renderSimpleAnalysis(simpleResult)
                      ) : loading ? (
                        <div className="relative inline-block my-2 overflow-hidden px-4">
                          <span className="text-3xl md:text-5xl font-bold font-mplus text-gray-300 select-none filter blur-[0.5px]">
                            {cleanVocabList[vocabIndex]?.word}
                          </span>
                          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-laser-scan"></div>
                        </div>
                      ) : (
                        <span className="text-3xl md:text-5xl font-bold font-mplus text-gray-800">
                          {cleanVocabList[vocabIndex]?.word}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-1 items-center">
                      {cleanVocabList[vocabIndex]?.hiragana && (
                        <div className="font-body-lg text-body-lg text-on-surface-variant bg-surface-container px-4 py-2 rounded-lg inline-block">
                          Cách đọc: {cleanVocabList[vocabIndex].hiragana} ({toRomaji(cleanVocabList[vocabIndex].hiragana)})
                        </div>
                      )}
                      <div className="font-body-md text-body-md text-outline mt-1.5 italic">
                        Ý nghĩa: "{cleanHanhVietMeaning(cleanVocabList[vocabIndex]?.meanings?.[0]?.meaningVn) || "—"}"
                      </div>
                    </div>

                    <button
                      onClick={() => playBrowserTTS(cleanVocabList[vocabIndex]?.word)}
                      className="mt-3 text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 font-label-md text-label-md border border-solid border-primary/20 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">volume_up</span> Nghe phát âm mẫu
                    </button>
                  </section>

                  {/* Vùng trạng thái đang chấm điểm (Loading) */}
                  {loading && (
                    <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-primary/10 flex items-center gap-4 animate-pulse">
                      <Spin size="default" />
                      <div className="flex-1">
                        <h3 className="m-0 font-bold text-primary flex items-center gap-2 text-sm md:text-base">
                          🤖 AI đang phân tích phát âm...
                        </h3>
                        <p className="m-0 mt-1 text-on-surface-variant text-xs md:text-sm">
                          Đang phân tích độ chuẩn xác, ngữ điệu và phát âm từng âm tiết.
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Vùng kết quả điểm số */}
                  {simpleResult && (
                    <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-card border border-primary/10 flex flex-col gap-stack-lg animate-fade-in-up">
                      {/* Score Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 m-0 text-base md:text-xl">
                          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {simpleResult.score >= 85 ? "stars" : "check_circle"}
                          </span>
                          Kết quả phát âm
                        </h3>
                        <div className="flex items-baseline gap-1 bg-tertiary-container/10 px-4 py-2 rounded-xl border border-solid border-tertiary/20">
                          <span className="text-display-lg font-display-lg text-tertiary text-2xl md:text-4xl">{simpleResult.score}</span>
                          <span className="text-tertiary font-label-md text-label-md font-bold">/ 100</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                          <span>Độ lưu loát & chính xác</span>
                          <span className="text-tertiary font-bold">
                            {simpleResult.score >= 85 ? "Xuất sắc! 🥇" : simpleResult.score >= 50 ? "Khá tốt 👍" : "Cần cố gắng 💪"}
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-tertiary-fixed-dim to-tertiary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${simpleResult.score}%` }}></div>
                        </div>
                      </div>

                      {/* Feedback Tip */}
                      {simpleResult.feedback && (
                        <div className="bg-surface-container-low p-4 rounded-lg flex gap-3 items-start border border-solid border-primary-fixed-dim/30">
                          <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                          <p className="font-body-md text-body-md text-on-surface-variant m-0 leading-relaxed">
                            {simpleResult.feedback}
                          </p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: GỢI Ý HỘI THOẠI */}
          {level === 2 && (
            <div className="flex-1 min-h-0 flex flex-col justify-between">
              {(() => {
                const staticDialogues = guidedDialogues[topic.nameVi] || [];
                const allDialogues = [...staticDialogues, ...dynamicDialogues];
                const currentScript = allDialogues[dialogueIndex];

                if (!currentScript) {
                  return (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center gap-4">
                      <p className="m-0 font-medium text-gray-500">Chủ đề này chưa có kịch bản hội thoại mặc định.</p>
                      <button
                        type="button"
                        onClick={handleGenerateAiDialogue}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md border-none cursor-pointer shadow-sm hover:bg-primary-container"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span> Tạo hội thoại mới bằng AI
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Header thông tin hội thoại */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                      <span className="text-label-md font-label-md text-primary uppercase tracking-wider font-bold">
                        Hội thoại #{dialogueIndex + 1} {currentScript.isAiGenerated ? " (Tạo bởi AI 🤖)" : " (Mặc định)"}
                      </span>
                      <button
                        onClick={handleGenerateAiDialogue}
                        disabled={aiGenerating}
                        className="flex items-center gap-1.5 px-4 py-2 border border-solid border-primary/20 hover:bg-primary/5 text-primary rounded-full font-label-md text-label-md bg-transparent cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span> Tạo câu mới bằng AI
                      </button>
                    </div>

                    {/* Phần hội thoại AI Hỏi */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/10 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        <span className="font-label-md text-label-md text-outline font-semibold">AI Assistant Hỏi:</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-japanese-display text-on-surface m-0 text-xl md:text-2xl font-bold font-mplus">
                          {currentScript.question}
                        </h3>
                        <button
                          onClick={() => playBrowserTTS(currentScript.question)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">volume_up</span>
                        </button>
                      </div>
                      <p className="m-0 text-on-surface-variant text-xs md:text-sm italic">
                        Ý nghĩa: {currentScript.questionVi}
                      </p>
                    </div>

                    {/* Phần User chọn Đáp án để nói */}
                    <div className="flex flex-col gap-3">
                      <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1">
                        Chọn 1 phương án dưới đây và luyện đọc:
                      </span>
                      {currentScript.options.map((opt: IDialogueOption, idx: number) => {
                        const isSelected = selectedOptionIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (loading) return;
                              setSelectedOptionIdx(idx);
                              setGuidedResult(null);
                            }}
                            className={`p-4 rounded-xl border border-solid transition-all cursor-pointer flex justify-between items-center relative overflow-hidden ${
                              isSelected
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex-1 pr-4 min-w-0">
                              <span className={`font-japanese-body text-japanese-body block text-sm md:text-base font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                                {opt.jp}
                              </span>
                              <span className="text-[12px] text-on-surface-variant mt-1 block italic">
                                Nghĩa: {opt.vi}
                              </span>
                            </div>
                            {loading && isSelected && (
                              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-laser-scan"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptionIdx(idx);
                                setGuidedResult(null);
                                playBrowserTTS(opt.jp);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary border-none cursor-pointer flex-shrink-0"
                            >
                              <span className="material-symbols-outlined text-lg">volume_up</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hiển thị phân tích chữ lỗi hoặc trạng thái Loading */}
                    {loading && (
                      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-primary/10 flex items-center gap-4 animate-pulse">
                        <Spin size="default" />
                        <div className="flex-1">
                          <h3 className="m-0 font-bold text-primary flex items-center gap-2 text-sm md:text-base">
                            🤖 AI đang chấm điểm đối thoại...
                          </h3>
                          <p className="m-0 mt-1 text-on-surface-variant text-xs md:text-sm">
                            Hệ thống đang chấm điểm phát âm câu hội thoại dựa trên ngữ cảnh chủ đề.
                          </p>
                        </div>
                      </section>
                    )}

                    {guidedResult && (
                      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-card border border-primary/10 flex flex-col gap-stack-lg animate-fade-in-up">
                        {/* Score Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 m-0 text-base md:text-xl">
                            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {guidedResult.score >= 85 ? "stars" : "check_circle"}
                            </span>
                            Kết quả phát âm đối thoại
                          </h3>
                          <div className="flex items-baseline gap-1 bg-tertiary-container/10 px-4 py-2 rounded-xl border border-solid border-tertiary/20">
                            <span className="text-display-lg font-display-lg text-tertiary text-2xl md:text-4xl">{guidedResult.score}</span>
                            <span className="text-tertiary font-label-md text-label-md font-bold">/ 100</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                            <span>Độ lưu loát & chính xác</span>
                            <span className="text-tertiary font-bold">
                              {guidedResult.score >= 85 ? "Xuất sắc! 🥇" : guidedResult.score >= 50 ? "Khá tốt 👍" : "Cần cố gắng 💪"}
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-tertiary-fixed-dim to-tertiary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${guidedResult.score}%` }}></div>
                          </div>
                        </div>

                        {/* Word-by-word Analysis details */}
                        <div className="flex flex-wrap gap-2 justify-center py-2 bg-surface-container-low rounded-xl border border-solid border-outline-variant/10 p-3">
                          {guidedResult.wordsAnalysis && guidedResult.wordsAnalysis.length > 0 ? (
                            guidedResult.wordsAnalysis.map((item, idx) => (
                              <Tooltip key={idx} title={item.isCorrect ? "Chính xác!" : item.phonemeError || "Sai phát âm"}>
                                <div className={`flex flex-col items-center justify-center p-3 rounded-lg min-w-[70px] border border-solid ${
                                  item.isCorrect
                                    ? "bg-tertiary-container/10 border-tertiary/30 text-tertiary"
                                    : "bg-error-container/30 border-error/30 text-error"
                                }`}>
                                  <span className="font-japanese-body text-japanese-body text-on-surface text-lg font-bold">{item.word}</span>
                                  <span className="font-label-md text-label-md mt-1 text-xs">{item.isCorrect ? "Great" : "Incorrect"}</span>
                                </div>
                              </Tooltip>
                            ))
                          ) : (
                            <span className="font-mplus font-bold text-gray-800 text-sm md:text-base">{currentScript.options[selectedOptionIdx]?.jp}</span>
                          )}
                        </div>

                        {/* Feedback Tip */}
                        {guidedResult.feedback && (
                          <div className="bg-surface-container-low p-4 rounded-lg flex gap-3 items-start border border-solid border-primary-fixed-dim/30">
                            <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                            <p className="font-body-md text-body-md text-on-surface-variant m-0 leading-relaxed">
                              {guidedResult.feedback}
                            </p>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* LEVEL 3: KAIWA TỰ DO */}
          {level === 3 && (
            <div className="flex-1 min-h-0 flex flex-col h-full justify-between">
              
              {/* Cửa sổ chat cuộn */}
              <div className="flex-grow min-h-[150px] md:min-h-[250px] overflow-y-auto bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 shadow-inner mb-6 space-y-4 flex flex-col">
                {chatMessages.map((msg, index) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 max-w-[85%] ${
                        isUser ? "self-end flex-row-reverse" : "self-start animate-fade-in-up"
                      }`}
                    >
                      {/* Avatar đại diện */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
                        isUser
                          ? "bg-primary text-on-primary"
                          : "bg-tertiary-container text-on-tertiary-container"
                      }`}>
                        {isUser ? "ME" : "AI"}
                      </div>

                      <div className="flex flex-col gap-1 max-w-[calc(100%-48px)]">
                        <div
                          className={`rounded-xl p-4 shadow-sm border ${
                            isUser
                              ? "bg-primary/5 border-primary/20 text-on-surface"
                              : "bg-tertiary-container/10 border-tertiary/20 text-on-surface"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-japanese-body text-japanese-body text-sm md:text-base font-semibold leading-relaxed break-words">{msg.text}</span>
                            <button
                              onClick={() => playBrowserTTS(msg.text)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface hover:bg-surface-container transition-colors text-primary border-none cursor-pointer flex-shrink-0"
                            >
                              <span className="material-symbols-outlined text-[16px]">volume_up</span>
                            </button>
                          </div>

                          {msg.translation && (
                            <div className="text-[12px] text-on-surface-variant mt-2 border-t border-dashed border-outline-variant/20 pt-1">
                              Dịch: {msg.translation}
                            </div>
                          )}
                        </div>

                        {/* Phản hồi điểm số & ngữ pháp nếu có (Chỉ tin nhắn của User) */}
                        {isUser && msg.score !== undefined && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-fade-in-up">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm" style={{ backgroundColor: getScoreColor(msg.score) }}>
                                {msg.score >= 85 ? "🌟" : "🎙️"} {msg.score}đ
                              </span>
                              {msg.feedback && (
                                <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                                  {msg.feedback}
                                </span>
                              )}
                            </div>

                            {msg.grammarFeedback && (
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-[12px] text-on-surface-variant flex gap-2 items-start">
                                <span className="material-symbols-outlined text-primary text-sm mt-0.5">auto_awesome</span>
                                <p className="m-0 leading-relaxed">
                                  <strong className="text-primary">AI sửa lỗi ngữ pháp: </strong>
                                  {msg.grammarFeedback}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {loading && (
                  <div className="self-start flex items-center gap-3 animate-fade-in-up">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-sm shadow-sm">
                      AI
                    </div>
                    <div className="bg-tertiary-container/10 border border-tertiary/20 rounded-xl p-4 flex items-center gap-2 shadow-sm">
                      <Spin size="small" />
                      <span className="text-xs text-on-surface-variant italic">AI đang chuẩn bị câu trả lời...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút thao tác reset */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleResetChat}
                  className="flex items-center gap-1.5 px-4 py-2 border border-solid border-outline-variant hover:bg-surface-container-high rounded-full font-label-md text-label-md bg-transparent cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-sm">replay</span> Làm mới cuộc trò chuyện
                </button>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM ACTION AREA */}
        <footer className="mt-auto py-4 bg-surface border-t border-outline-variant/10 shadow-sm flex flex-col items-center gap-3 shrink-0 z-10">
          {/* Active visualizer wave */}
          {isRecording ? (
            <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs">
              <span className="text-xs text-error font-bold animate-pulse mr-2">REC {recordingDuration}s</span>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-error w-1.5 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(12, Math.min(64, volumeBar * (0.3 + Math.random() * 0.7)))}px` }}
                />
              ))}
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-outline text-sm">
              Sẵn sàng ghi âm
            </div>
          )}

          {/* Microphone button trigger */}
          <div className="flex items-center justify-center gap-4">
            {/* Retrying / Next triggers depending on result */}
            {level === 1 && simpleResult && (
              <button
                onClick={handleRetryVocab}
                className="flex items-center gap-1.5 px-4 py-2 border border-solid border-outline-variant hover:bg-surface-container-high rounded-full font-label-md text-label-md bg-transparent cursor-pointer text-on-surface-variant"
              >
                Đọc lại
              </button>
            )}
            
            {level === 2 && guidedResult && (
              <button
                onClick={() => setGuidedResult(null)}
                className="flex items-center gap-1.5 px-4 py-2 border border-solid border-outline-variant hover:bg-surface-container-high rounded-full font-label-md text-label-md bg-transparent cursor-pointer text-on-surface-variant"
              >
                Nói lại
              </button>
            )}

            {/* Main Mic Button */}
            <button
              onClick={isRecording ? stopRecordingAndSubmit : startRecording}
              disabled={loading || (level === 2 && selectedOptionIdx === -1)}
              style={{ cursor: (loading || (level === 2 && selectedOptionIdx === -1)) ? "not-allowed" : "pointer" }}
              className={`w-18 h-18 rounded-full border-4 border-solid border-surface shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                (level === 2 && selectedOptionIdx === -1)
                  ? "bg-gray-300 text-gray-500 shadow-none border-gray-100"
                  : isRecording
                  ? "bg-error text-on-error shadow-[0_8px_24px_rgba(186,26,26,0.3)] animate-pulse"
                  : "bg-primary text-on-primary shadow-[0_8px_24px_rgba(4,81,211,0.3)] hover:bg-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[32px] text-white">
                {loading ? "pending" : isRecording ? "stop" : "mic"}
              </span>
            </button>

            {/* Next triggers */}
            {level === 1 && simpleResult && (
              <button
                onClick={handleNextVocab}
                className="flex items-center gap-1.5 px-4 py-2 bg-tertiary text-on-tertiary hover:bg-tertiary-container rounded-full font-label-md text-label-md border-none cursor-pointer shadow-sm"
              >
                Từ tiếp <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
            
            {level === 2 && guidedResult && (
              <button
                onClick={handleNextDialogue}
                className="flex items-center gap-1.5 px-4 py-2 bg-tertiary text-on-tertiary hover:bg-tertiary-container rounded-full font-label-md text-label-md border-none cursor-pointer shadow-sm"
              >
                Câu tiếp <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
          </div>

          <p className="font-label-md text-label-md text-on-surface-variant m-0">
            {level === 2 && selectedOptionIdx === -1
              ? "Vui lòng chọn một phương án trả lời trước khi ghi âm"
              : isRecording
              ? "Bấm nút một lần nữa để kết thúc và chấm điểm"
              : "Chạm nút Micro để bắt đầu luyện nói"}
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-laser-scan {
          position: absolute;
          animation: laser-scan 2.2s infinite ease-in-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .speaking-practice-modal .ant-modal-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </Modal>
  );
}
