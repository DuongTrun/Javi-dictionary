import React, { useEffect, useState } from "react";
import { Card, Button, Typography, Spin, Pagination, Empty, Breadcrumb, Tag } from "antd";
import {
    PiCompass,
    PiBriefcase,
    PiGraduationCap,
    PiBowlFood,
    PiChatCircleText,
    PiArrowLeft,
    PiBookOpen,
    PiMicrophone,
} from "react-icons/pi";
import { callGetTopics } from "@/apis/topicApi";
import { callGetVocabularyPage } from "@/apis/vocabularyApi";
import { ITopic, IVocabResponse } from "@/types/backend";
import VocabularyDetail from "@/components/vocabulary/VocabularyDetail";
import SpeakingPracticeModal from "@/components/voice/SpeakingPracticeModal";

const { Title, Paragraph, Text } = Typography;

// Ánh xạ icon và màu sắc cho từng chủ đề dựa trên tên tiếng Việt
const topicStyleMap: Record<string, { icon: React.ReactNode; gradient: string; textClass: string; borderClass: string }> = {
    "Du lịch": {
        icon: <PiCompass className="text-4xl" />,
        gradient: "from-blue-50 to-indigo-100",
        textClass: "text-blue-600",
        borderClass: "border-blue-200",
    },
    "Công sở": {
        icon: <PiBriefcase className="text-4xl" />,
        gradient: "from-amber-50 to-orange-100",
        textClass: "text-amber-600",
        borderClass: "border-amber-200",
    },
    "Trường học": {
        icon: <PiGraduationCap className="text-4xl" />,
        gradient: "from-emerald-50 to-teal-100",
        textClass: "text-emerald-600",
        borderClass: "border-emerald-200",
    },
    "Ăn uống": {
        icon: <PiBowlFood className="text-4xl" />,
        gradient: "from-rose-50 to-red-100",
        textClass: "text-rose-600",
        borderClass: "border-rose-200",
    },
    "Giao tiếp hàng ngày": {
        icon: <PiChatCircleText className="text-4xl" />,
        gradient: "from-purple-50 to-fuchsia-100",
        textClass: "text-purple-600",
        borderClass: "border-purple-200",
    },
};

const defaultStyle = {
    icon: <PiBookOpen className="text-4xl" />,
    gradient: "from-gray-50 to-slate-100",
    textClass: "text-slate-600",
    borderClass: "border-slate-200",
};

const JLPT_LEVELS = ["Tất cả", "N5", "N4", "N3", "N2", "N1"] as const;
type JlptFilter = typeof JLPT_LEVELS[number];

const levelColorMap: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
    "Tất cả": { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", activeBg: "bg-gray-700" },
    N5: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", activeBg: "bg-emerald-600" },
    N4: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", activeBg: "bg-sky-600" },
    N3: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", activeBg: "bg-amber-600" },
    N2: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", activeBg: "bg-orange-600" },
    N1: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", activeBg: "bg-rose-600" },
};

export default function TopicsPage() {
    const [topics, setTopics] = useState<ITopic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<ITopic | null>(null);
    const [isSpeakingModalOpen, setIsSpeakingModalOpen] = useState(false);
    const [jlptFilter, setJlptFilter] = useState<JlptFilter>("Tất cả");

    // State cho danh sách từ vựng thuộc chủ đề
    const [vocabList, setVocabList] = useState<IVocabResponse[]>([]);
    const [loadingVocab, setLoadingVocab] = useState(false);
    const [selectedVocab, setSelectedVocab] = useState<IVocabResponse | null>(null);
    const [page, setPage] = useState(1);
    const [totalVocabs, setTotalVocabs] = useState(0);
    const pageSize = 8;

    // Load danh sách chủ đề
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await callGetTopics();
                if (res.data && res.data.result) {
                    setTopics(res.data.result);
                }
            } catch (e) {
                console.error("Lỗi tải danh sách chủ đề:", e);
            } finally {
                setLoadingTopics(false);
            }
        };
        fetchTopics();
    }, []);

    // Load danh sách từ vựng khi chọn chủ đề, đổi trang, hoặc đổi filter JLPT
    useEffect(() => {
        if (!selectedTopic) return;

        const fetchVocabs = async () => {
            setLoadingVocab(true);
            try {
                // Xây dựng filter kết hợp chủ đề + cấp độ JLPT
                let filter = `topics.id : ${selectedTopic.id}`;
                if (jlptFilter !== "Tất cả") {
                    filter += ` and level : '${jlptFilter}'`;
                }

                const res = await callGetVocabularyPage({
                    page: page - 1,
                    size: pageSize,
                    filter,
                });
                if (res.data && res.data.result) {
                    const content = res.data.result.content || [];
                    setVocabList(content);
                    setTotalVocabs(res.data.result.totalElements || 0);

                    // Auto-select từ đầu tiên trong danh sách nếu có
                    if (content.length > 0) {
                        setSelectedVocab(content[0]);
                    } else {
                        setSelectedVocab(null);
                    }
                }
            } catch (e) {
                console.error("Lỗi tải từ vựng theo chủ đề:", e);
            } finally {
                setLoadingVocab(false);
            }
        };

        fetchVocabs();
    }, [selectedTopic, page, jlptFilter]);

    // Trở lại danh sách chủ đề
    const handleBack = () => {
        setSelectedTopic(null);
        setVocabList([]);
        setSelectedVocab(null);
        setPage(1);
        setTotalVocabs(0);
        setJlptFilter("Tất cả");
    };

    // Đổi filter JLPT => reset về trang 1
    const handleJlptFilter = (level: JlptFilter) => {
        setJlptFilter(level);
        setPage(1);
    };

    if (loadingTopics) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Đang tải các chủ đề học tập..." />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* BREADCRUMB */}
            <Breadcrumb className="mb-6">
                <Breadcrumb.Item>
                    <span className="cursor-pointer text-gray-500 hover:text-blue-600" onClick={handleBack}>
                        Trang chủ
                    </span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <span className="text-gray-500">Học theo Chủ đề</span>
                </Breadcrumb.Item>
                {selectedTopic && (
                    <Breadcrumb.Item>
                        <span className="font-semibold text-blue-600">{selectedTopic.nameVi}</span>
                    </Breadcrumb.Item>
                )}
            </Breadcrumb>

            {/* MÀN HÌNH DANH SÁCH CHỦ ĐỀ */}
            {!selectedTopic ? (
                <>
                    <div className="mb-8">
                        <Title level={2} className="m-0 font-bold text-gray-800">
                            📚 Học tiếng Nhật theo Chủ đề
                        </Title>
                        <Paragraph className="text-gray-500 mt-2 text-base">
                            Lựa chọn chủ đề bạn quan tâm để học từ vựng theo ngữ cảnh thực tế, giúp ghi nhớ sâu và phản xạ nhanh hơn.
                        </Paragraph>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topics.map((t) => {
                            const style = topicStyleMap[t.nameVi] || defaultStyle;
                            return (
                                <Card
                                    key={t.id}
                                    hoverable
                                    className={`relative overflow-hidden border border-solid ${style.borderClass} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${style.gradient}`}
                                    onClick={() => setSelectedTopic(t)}
                                >
                                    <div className="flex items-start gap-4 p-2">
                                        <div className={`p-3 rounded-xl bg-white shadow-sm ${style.textClass}`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <Title level={4} className="m-0 font-bold text-gray-800">
                                                    {t.nameJa}
                                                </Title>
                                                <Text className="text-[12px] bg-white px-2 py-0.5 rounded-full font-medium text-gray-500 shadow-sm border border-gray-100 border-solid">
                                                    Chủ đề #{t.id}
                                                </Text>
                                            </div>
                                            <Title level={5} className="m-0 mt-1 font-semibold text-gray-700">
                                                {t.nameVi}
                                            </Title>
                                            <Paragraph className="text-gray-500 text-sm mt-3 line-clamp-2 h-10">
                                                {t.description || "Tìm hiểu từ vựng tiếng Nhật bổ ích theo chủ đề này."}
                                            </Paragraph>
                                            <div className="mt-4 flex justify-between items-center">
                                                <span className={`text-sm font-semibold ${style.textClass}`}>
                                                    Học ngay &rarr;
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </>
            ) : (
                /* MÀN HÌNH CHI TIẾT CHỦ ĐỀ & TỪ VỰNG */
                <div>
                    {/* Header Chủ đề */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                shape="circle"
                                icon={<PiArrowLeft className="text-xl" />}
                                onClick={handleBack}
                                className="hover:border-blue-500 hover:text-blue-500 flex items-center justify-center"
                            />
                            <div>
                                <Title level={3} className="m-0 font-bold text-gray-800">
                                    {selectedTopic.nameJa} — {selectedTopic.nameVi}
                                </Title>
                                <Paragraph className="text-gray-500 m-0 mt-1 text-sm">
                                    {selectedTopic.description} ({totalVocabs} từ vựng)
                                </Paragraph>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            shape="round"
                            icon={<PiMicrophone className="text-lg" />}
                            onClick={() => setIsSpeakingModalOpen(true)}
                            className="bg-blue-600 border-blue-600 hover:bg-blue-700 h-10 px-5 font-semibold flex items-center gap-2 shadow-sm"
                        >
                            Luyện nói AI
                        </Button>
                    </div>

                    {/* Bộ lọc cấp độ JLPT */}
                    <div className="mb-5 flex items-center gap-2 flex-wrap">
                        <Text className="text-sm font-semibold text-gray-500 mr-1">Cấp độ:</Text>
                        {JLPT_LEVELS.map((level) => {
                            const isActive = jlptFilter === level;
                            const colors = levelColorMap[level];
                            return (
                                <button
                                    key={level}
                                    onClick={() => handleJlptFilter(level)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border border-solid transition-all duration-200 cursor-pointer
                                        ${isActive
                                            ? `${colors.activeBg} text-white border-transparent shadow-sm scale-105`
                                            : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-sm hover:scale-105`
                                        }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>

                    {/* Khung nội dung song song */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Danh sách từ (Bên trái) */}
                        <div className="lg:col-span-5 bg-white border border-gray-200 border-solid rounded-2xl p-4 shadow-sm">
                            <Title level={5} className="mt-0 mb-4 font-bold text-gray-700">
                                Danh sách từ vựng ({totalVocabs})
                                {jlptFilter !== "Tất cả" && (
                                    <Tag color="blue" className="ml-2 text-xs align-middle">{jlptFilter}</Tag>
                                )}
                            </Title>

                            {loadingVocab ? (
                                <div className="flex flex-col justify-center items-center py-20 gap-3">
                                    <Spin />
                                    <Text type="secondary" italic>Đang tải từ vựng...</Text>
                                </div>
                            ) : vocabList.length === 0 ? (
                                <Empty description="Chưa có từ vựng nào trong chủ đề này." />
                            ) : (
                                <div className="space-y-3">
                                    {vocabList.map((v) => {
                                        const isSelected = selectedVocab?.id === v.id;
                                        return (
                                            <div
                                                key={v.id}
                                                onClick={() => setSelectedVocab(v)}
                                                className={`p-3.5 rounded-xl border border-solid transition-all duration-200 cursor-pointer flex justify-between items-center ${
                                                    isSelected
                                                        ? "bg-blue-50 border-blue-300 shadow-sm"
                                                        : "bg-white border-gray-100 hover:bg-slate-50"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <Text className={`text-xl font-bold font-mplus ${isSelected ? "text-blue-600" : "text-gray-800"}`}>
                                                            {v.word}
                                                        </Text>
                                                        {v.hiragana && (
                                                            <Text type="secondary" className="text-xs">
                                                                {v.hiragana}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-[260px] mt-1 font-sans">
                                                        {v.meanings?.[0]?.meaningVn 
                                                            ? v.meanings[0].meaningVn.replace(/<[^>]*>/g, "").trim()
                                                            : "—"
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {v.level && (
                                                        <span className="text-[10px] font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                                                            {v.level}
                                                        </span>
                                                    )}
                                                    {v.wordType && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {v.wordType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* PHÂN TRANG */}
                                    <div className="pt-4 flex justify-center">
                                        <Pagination
                                            current={page}
                                            pageSize={pageSize}
                                            total={totalVocabs}
                                            onChange={(p) => {
                                                setPage(p);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            size="small"
                                            showSizeChanger={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chi tiết từ vựng (Bên phải) */}
                        <div className="lg:col-span-7">
                            {selectedVocab ? (
                                <VocabularyDetail data={selectedVocab} />
                            ) : (
                                <div className="bg-slate-50 border border-dashed border-gray-300 rounded-2xl p-16 text-center text-gray-400">
                                    <PiBookOpen className="text-5xl mx-auto mb-3 opacity-60" />
                                    <Paragraph className="m-0 text-base">Chọn một từ vựng bên trái để xem giải nghĩa chi tiết.</Paragraph>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {selectedTopic && (
                <SpeakingPracticeModal
                    visible={isSpeakingModalOpen}
                    onClose={() => setIsSpeakingModalOpen(false)}
                    topic={selectedTopic}
                    vocabList={vocabList}
                />
            )}
        </div>
    );
}
