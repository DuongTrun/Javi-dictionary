import { useEffect, useState } from "react";
import { Spin, Pagination, Empty, Breadcrumb } from "antd";
import { callGetTopics } from "@/apis/topicApi";
import { callGetVocabularyPage } from "@/apis/vocabularyApi";
import { ITopic, IVocabResponse } from "@/types/backend";
import VocabularyDetail from "@/components/vocabulary/VocabularyDetail";
import SpeakingPracticeModal from "@/components/voice/SpeakingPracticeModal";
import { toRomaji } from "wanakana";

const JLPT_LEVELS = ["Tất cả", "N5", "N4", "N3", "N2", "N1"] as const;
type JlptFilter = typeof JLPT_LEVELS[number];

// Beautiful topic styles mapped from Stitch Mockup
interface TopicStyleProps {
    bgClass: string;
    textPrimaryClass: string;
    textSecondaryClass: string;
    icon: string;
    iconColorClass: string;
    englishName: string;
    colSpanClass?: string;
    blurClass?: string;
}

const topicStyleMap: Record<string, TopicStyleProps> = {
    "Du lịch": {
        bgClass: "bg-primary-fixed border border-white/50",
        textPrimaryClass: "text-on-primary-fixed",
        textSecondaryClass: "text-on-primary-fixed/80",
        icon: "flight_takeoff",
        iconColorClass: "text-primary",
        englishName: "Travel & Transport",
        blurClass: "bg-white/30",
    },
    "Công sở": {
        bgClass: "bg-tertiary-fixed-dim border border-white/50",
        textPrimaryClass: "text-on-tertiary-fixed",
        textSecondaryClass: "text-on-tertiary-fixed/80",
        icon: "business_center",
        iconColorClass: "text-tertiary",
        englishName: "Business & Office",
        blurClass: "bg-white/30",
    },
    "Trường học": {
        bgClass: "bg-secondary-fixed border border-white/50",
        textPrimaryClass: "text-on-secondary-fixed",
        textSecondaryClass: "text-on-secondary-fixed/80",
        icon: "school",
        iconColorClass: "text-secondary",
        englishName: "School & Education",
        colSpanClass: "lg:col-span-1 sm:col-span-2",
        blurClass: "bg-white/40",
    },
    "Ăn uống": {
        bgClass: "bg-surface-container-high border border-white/50",
        textPrimaryClass: "text-on-surface",
        textSecondaryClass: "text-on-surface-variant",
        icon: "restaurant",
        iconColorClass: "text-surface-tint",
        englishName: "Food & Dining",
        blurClass: "bg-white/50",
    },
    "Giao tiếp hàng ngày": {
        bgClass: "bg-error-container border border-white/50",
        textPrimaryClass: "text-on-error-container",
        textSecondaryClass: "text-on-error-container/80",
        icon: "forum",
        iconColorClass: "text-error",
        englishName: "Daily Conversation",
        colSpanClass: "sm:col-span-2 lg:col-span-2",
        blurClass: "bg-white/20",
    },
};

const defaultTopicStyle: TopicStyleProps = {
    bgClass: "bg-surface-container-low border border-outline-variant/10",
    textPrimaryClass: "text-on-surface",
    textSecondaryClass: "text-on-surface-variant",
    icon: "menu_book",
    iconColorClass: "text-primary",
    englishName: "General Vocabulary",
    blurClass: "bg-white/30",
};

const levelColorMap: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
    "Tất cả": { bg: "bg-surface-container-low", text: "text-on-surface-variant", border: "border-outline-variant/20", activeBg: "bg-primary text-white" },
    N5: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", activeBg: "bg-emerald-600 text-white" },
    N4: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", activeBg: "bg-sky-600 text-white" },
    N3: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", activeBg: "bg-amber-600 text-white" },
    N2: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", activeBg: "bg-orange-600 text-white" },
    N1: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", activeBg: "bg-rose-600 text-white" },
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

                    // Auto-select từ đầu tiên
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-body-md text-on-surface antialiased">
            {/* BREADCRUMB */}
            <Breadcrumb className="mb-6">
                <Breadcrumb.Item>
                    <span className="cursor-pointer text-outline hover:text-primary transition-colors" onClick={handleBack}>
                        Trang chủ
                    </span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <span className="text-outline">Học theo Chủ đề</span>
                </Breadcrumb.Item>
                {selectedTopic && (
                    <Breadcrumb.Item>
                        <span className="font-semibold text-primary">{selectedTopic.nameVi}</span>
                    </Breadcrumb.Item>
                )}
            </Breadcrumb>

            {/* MÀN HÌNH DANH SÁCH CHỦ ĐỀ */}
            {!selectedTopic ? (
                <>
                    <div className="mb-stack-lg pt-2">
                        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 font-bold">
                            Chủ đề học tập
                        </h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                            Khám phá từ vựng thông qua các ngữ cảnh thực tế, giúp ghi nhớ sâu và phản xạ nhanh hơn.
                        </p>
                    </div>

                    {/* Bento Grid of Topics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter mb-12">
                        {topics.map((t) => {
                            const style = topicStyleMap[t.nameVi] || defaultTopicStyle;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTopic(t)}
                                    className={`group relative rounded-[24px] p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col h-[260px] justify-between ${style.bgClass} ${style.colSpanClass || ""}`}
                                >
                                    {/* Decorative blurred circle */}
                                    <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-transform ${style.blurClass}`}></div>
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mb-stack-md shadow-sm">
                                                <span className={`material-symbols-outlined text-[28px] ${style.iconColorClass}`}>
                                                    {style.icon}
                                                </span>
                                            </div>
                                            <h3 className={`font-headline-md text-headline-md font-bold mb-1 ${style.textPrimaryClass}`}>
                                                {t.nameVi}
                                            </h3>
                                            <p className={`font-body-md text-body-md ${style.textSecondaryClass}`}>
                                                {t.nameJa} — {style.englishName}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTopic(t);
                                                    setIsSpeakingModalOpen(true);
                                                }}
                                                className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(4,81,211,0.2)] hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 border-none cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                                                Luyện nói với AI
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                /* MÀN HÌNH CHI TIẾT CHỦ ĐỀ & TỪ VỰNG */
                <div>
                    {/* Header Chủ đề */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={handleBack}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-solid border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors bg-transparent cursor-pointer"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="font-headline-md text-headline-md font-bold text-on-surface m-0">
                                    {selectedTopic.nameJa} — {selectedTopic.nameVi}
                                </h1>
                                <p className="font-body-md text-body-md text-on-surface-variant m-0 mt-1">
                                    {selectedTopic.description || "Danh sách từ vựng bổ ích của chủ đề."} ({totalVocabs} từ vựng)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSpeakingModalOpen(true)}
                            className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-label-md text-label-md py-2.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-sm border-none cursor-pointer transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">mic</span>
                            Luyện nói AI
                        </button>
                    </div>

                    {/* Bộ lọc cấp độ JLPT */}
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface-variant mr-2 font-semibold">Cấp độ JLPT:</span>
                        {JLPT_LEVELS.map((level) => {
                            const isActive = jlptFilter === level;
                            const colors = levelColorMap[level];
                            return (
                                <button
                                    key={level}
                                    onClick={() => handleJlptFilter(level)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border border-solid transition-all duration-200 cursor-pointer
                                        ${isActive
                                            ? `${colors.activeBg} border-transparent shadow-sm scale-105`
                                            : `${colors.bg} ${colors.text} ${colors.border} hover:bg-surface-container-high`
                                        }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>

                    {/* Khung nội dung song song */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                        {/* Danh sách từ (Bên trái) */}
                        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/10">
                                <h3 className="m-0 font-headline-md text-base font-bold text-on-surface">
                                    Danh sách từ vựng
                                </h3>
                                <span className="bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                    {totalVocabs} từ
                                </span>
                            </div>

                            {loadingVocab ? (
                                <div className="flex flex-col justify-center items-center py-20 gap-3">
                                    <Spin />
                                    <span className="text-on-surface-variant italic text-sm">Đang tải từ vựng...</span>
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
                                                className={`p-4 rounded-xl border border-solid transition-all duration-200 cursor-pointer flex justify-between items-center ${
                                                    isSelected
                                                        ? "bg-primary/5 border-primary shadow-sm"
                                                        : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low"
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <div className="flex items-baseline gap-2 flex-wrap">
                                                        <span className={`text-xl font-bold font-japanese-display ${isSelected ? "text-primary" : "text-on-surface"}`}>
                                                            {v.word}
                                                        </span>
                                                        {v.hiragana && (
                                                            <span className="text-xs text-on-surface-variant font-japanese-body">
                                                                {v.hiragana} ({toRomaji(v.hiragana)})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-on-surface-variant truncate mt-1">
                                                        {v.meanings?.[0]?.meaningVn 
                                                            ? v.meanings[0].meaningVn.replace(/<[^>]*>/g, "").trim()
                                                            : "—"
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {v.level && (
                                                        <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">
                                                            {v.level}
                                                        </span>
                                                    )}
                                                    {v.wordType && (
                                                        <span className="text-[10px] text-on-surface-variant">
                                                            {v.wordType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* PHÂN TRANG */}
                                    <div className="pt-4 flex justify-center border-t border-outline-variant/10">
                                        <Pagination
                                            current={page}
                                            pageSize={pageSize}
                                            total={totalVocabs}
                                            onChange={(p) => {
                                                setPage(p);
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
                                <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-2xl p-16 text-center text-on-surface-variant shadow-sm">
                                    <span className="material-symbols-outlined text-5xl opacity-40 mb-3 block">menu_book</span>
                                    <p className="m-0 text-base">Chọn một từ vựng bên trái để xem giải nghĩa chi tiết.</p>
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
