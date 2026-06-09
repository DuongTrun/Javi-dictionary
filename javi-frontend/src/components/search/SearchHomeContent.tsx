import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { callGetHistory } from "@/apis/historyApi";
import HistoryModal from "@/components/history/HistoryModal";
import SearchResultModal from "@/components/search/SearchResultModal";
import HistoryPickerModal from "@/components/history/HistoryPickerModal";
import { EntityType } from "@/types/backend";
import { useNavigate } from "react-router-dom";
import RequireLoginModal from "../common/RequireLoginModal";
import { toast } from "react-toastify";

// Dịch vụ phát âm trình duyệt
const playBrowserTTS = (text: string) => {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    } else {
        toast.warning("Trình duyệt của bạn không hỗ trợ phát âm.");
    }
};

export default function SearchHomeContent() {
    const user = useAuthStore((s) => s.user);
    const isLoggedIn = !!user;
    const isPremium = user?.accountType === "PREMIUM";

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // modal lịch sử (danh sách)
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // picker modal khi click history item mà không có entityId
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerKeyword, setPickerKeyword] = useState<string>("");
    const [pickerDefaultTab, setPickerDefaultTab] = useState<
        "KANJI" | "WORD" | "GRAMMAR" | null
    >(null);

    // modal detail universal
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] =
        useState<EntityType>("WORD");
    const [detailEntityId, setDetailEntityId] = useState<number | string>(0);

    const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
    const [tourStep, setTourStep] = useState<number>(0);

    const navigate = useNavigate();

    useEffect(() => {
        const hasSeenTour = localStorage.getItem("javi_onboarding_seen");
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                setTourStep(1);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    /** Gọi API lấy lịch sử khi đã đăng nhập */
    const fetchHistory = () => {
        if (!isLoggedIn) return;

        setLoading(true);
        callGetHistory(1)
            .then((res) => {
                setHistory(res.data?.result?.content || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistory();
    }, [isLoggedIn]);

    const openHistoryModal = () => setHistoryModalOpen(true);
    const closeHistoryModal = () => setHistoryModalOpen(false);

    const openDetailFromChip = (h: any) => {
        const type = String(h?.entityType ?? "").toUpperCase();

        if (
            h?.entityId !== undefined &&
            h?.entityId !== null &&
            String(h.entityId) !== ""
        ) {
            let idOrName: number | string = h.entityId;
            if (type === "KANJI" && h.entityName) {
                idOrName = h.entityName;
            }
            setDetailEntityType(h.entityType);
            setDetailEntityId(idOrName);
            setDetailOpen(true);
            return;
        }

        const kw = h.entityName ?? h.keyword ?? "";
        if (!kw) return;

        setPickerKeyword(kw);
        setPickerDefaultTab(null);
        setPickerOpen(true);
    };

    const handlePickerSelect = (payload: {
        entityType: "KANJI" | "WORD" | "GRAMMAR";
        id?: number | string;
        name?: string;
    }) => {
        if (
            payload.id !== undefined &&
            payload.id !== null &&
            String(payload.id).trim() !== ""
        ) {
            setDetailEntityType(payload.entityType as EntityType);
            setDetailEntityId(payload.id as number | string);
            setDetailOpen(true);
            return;
        }

        const kw = payload.name ?? "";
        if (!kw) return;

        setHistoryModalOpen(false);

        const params = new URLSearchParams();
        params.set("keyword", kw);
        params.set("type", payload.entityType ?? "WORD");
        navigate(`/search?${params.toString()}`);
    };

    const handleSaveWordOfTheDay = () => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để lưu từ vựng.");
        } else {
            toast.success("Đã lưu từ vựng '絆 (Kizuna)' vào sổ tay của bạn!");
        }
    };

    return (
        <div className="flex flex-col gap-6 font-body-md text-on-surface antialiased">
            {/* HERO SECTION */}
            <section className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
                <h1 className="font-display-lg text-display-lg text-primary mb-3 hidden md:block font-bold">
                    Master JP-VN
                </h1>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2 md:hidden font-bold">
                    Master JP-VN
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl m-0">
                    Tra cứu từ vựng, hán tự, ngữ pháp bằng tiếng Nhật, Romaji hoặc tiếng Việt.
                </p>
                <button
                    onClick={() => setTourStep(1)}
                    className="mt-3 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer active:scale-95 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[16px]">info</span> Hướng dẫn sử dụng nhanh
                </button>

                {/* Gần đây (Recent Searches) */}
                {isLoggedIn && (history.length > 0 || loading) && (
                    <div className="w-full max-w-3xl mt-6 flex flex-wrap justify-center items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface-variant mr-1 flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-base">history</span> Gần đây:
                        </span>
                        {loading ? (
                            <span className="text-xs text-on-surface-variant italic animate-pulse">Đang tải...</span>
                        ) : (
                            <>
                                {history.slice(0, 5).map((h, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => openDetailFromChip(h)}
                                        className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface transition-all border-none cursor-pointer active:scale-95 shadow-sm"
                                    >
                                        {h.entityName ?? h.keyword}
                                    </button>
                                ))}
                                <button
                                    onClick={openHistoryModal}
                                    className="text-xs font-bold text-primary hover:underline bg-transparent border-none cursor-pointer ml-2 flex items-center gap-0.5"
                                >
                                    Xem tất cả <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md md:gap-gutter">
                
                {/* Word of the Day */}
                <div id="word-of-the-day-card" className="col-span-1 md:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
                            <h2 className="font-headline-md text-lg md:text-xl text-on-surface font-bold m-0">Từ vựng mỗi ngày</h2>
                        </div>
                        <button
                            onClick={handleSaveWordOfTheDay}
                            className="text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1"
                            title="Lưu vào sổ tay"
                        >
                            <span className="material-symbols-outlined text-xl">bookmark_add</span>
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start relative z-10">
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 bg-primary/5 rounded-xl border border-solid border-primary/20">
                            <span className="font-japanese-display text-4xl text-primary font-medium">絆</span>
                        </div>
                        <div className="flex flex-col flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 flex-wrap">
                                <span className="font-japanese-body text-japanese-body text-on-surface font-semibold">きずな</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                <span className="font-body-md text-body-md text-on-surface-variant">Kizuna</span>
                                <span className="px-2.5 py-0.5 bg-tertiary/10 text-tertiary rounded-full font-label-md text-xs font-semibold">Danh từ</span>
                            </div>
                            <p className="font-body-lg text-lg text-on-surface font-bold mb-3 m-0">Sự kết nối / Tình thân</p>
                            <div className="bg-surface-container-low p-4 rounded-xl text-left border border-solid border-outline-variant/10">
                                <p className="font-japanese-body text-sm md:text-base text-on-surface mb-1 m-0">家族の絆を深める。</p>
                                <p className="font-body-md text-xs md:text-sm text-on-surface-variant m-0">Làm sâu sắc thêm tình cảm gia đình.</p>
                            </div>
                            <button
                                onClick={() => playBrowserTTS("絆")}
                                className="mt-3 bg-transparent border border-solid border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors self-center sm:self-start cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">volume_up</span> Nghe phát âm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trending searches */}
                <div className="col-span-1 md:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-secondary">trending_up</span>
                        <h2 className="font-headline-md text-lg md:text-xl text-on-surface font-bold m-0">Tìm kiếm phổ biến</h2>
                    </div>
                    
                    <div className="flex flex-col gap-3 flex-1">
                        {[
                            { rank: 1, word: "木漏れ日", romaji: "komorebi", meaning: "Ánh nắng xuyên qua lá" },
                            { rank: 2, word: "一期一会", romaji: "ichigo ichie", meaning: "Nhất kỳ nhất hội" },
                            { rank: 3, word: "猫", romaji: "neko", meaning: "Con mèo" }
                        ].map((item) => (
                            <div
                                key={item.rank}
                                onClick={() => navigate(`/search/word/${encodeURIComponent(item.word)}`)}
                                className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer group border border-solid border-transparent hover:border-outline-variant/10"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="font-label-md text-label-md text-outline font-bold w-4 text-center">{item.rank}</span>
                                    <div className="min-w-0">
                                        <h3 className="font-japanese-body text-base text-on-surface group-hover:text-primary transition-colors m-0 font-bold">{item.word}</h3>
                                        <p className="font-label-md text-xs text-on-surface-variant m-0 truncate">{item.meaning} ({item.romaji})</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explore Categories */}
                <div id="explore-categories-section" className="col-span-1 md:col-span-12 mt-2">
                    <h2 className="font-headline-md text-base md:text-lg text-on-surface mb-4 pl-2 font-bold">Khám phá Danh mục</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div
                            onClick={() => navigate("/jlpt?level=N3&type=vocab")}
                            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-solid border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[24px]">school</span>
                            </div>
                            <span className="font-body-md text-sm md:text-base text-on-surface font-semibold">Luyện thi JLPT</span>
                        </div>

                        <div
                            onClick={() => navigate("/topics")}
                            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-solid border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[24px]">business_center</span>
                            </div>
                            <span className="font-body-md text-sm md:text-base text-on-surface font-semibold">Công sở & Giao tiếp</span>
                        </div>

                        <div
                            onClick={() => navigate("/topics")}
                            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-solid border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                                <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
                            </div>
                            <span className="font-body-md text-sm md:text-base text-on-surface font-semibold">Du lịch</span>
                        </div>

                        <div
                            onClick={() => navigate("/topics")}
                            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-solid border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[24px]">local_dining</span>
                            </div>
                            <span className="font-body-md text-sm md:text-base text-on-surface font-semibold">Ẩm thực Nhật Bản</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nâng cấp Premium */}
            {!isPremium && (
                <section className="bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group mt-4">
                    <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                    <div className="relative z-10 flex flex-col">
                        <h3 className="text-xl font-bold tracking-tight mb-1.5 flex items-center gap-2 text-white m-0">
                            👑 Trải nghiệm Javi Premium
                        </h3>
                        <p className="text-sm text-white/90 m-0 mt-1">
                            Dịch ảnh OCR, học Spaced Repetition và luyện nói Kaiwa AI hoàn toàn không giới hạn!
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/premium")}
                        className="relative z-10 bg-[#FFD700] hover:bg-[#FFC800] text-on-primary-fixed font-bold text-sm px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border-none cursor-pointer shadow-md flex-shrink-0"
                    >
                        Nâng cấp ngay
                    </button>
                </section>
            )}

            {/* History modal */}
            <HistoryModal
                open={historyModalOpen}
                onClose={closeHistoryModal}
                onHistoryChanged={fetchHistory}
            />

            {/* Picker modal */}
            <HistoryPickerModal
                open={pickerOpen}
                keyword={pickerKeyword}
                defaultTab={pickerDefaultTab}
                onClose={() => setPickerOpen(false)}
                onSelect={handlePickerSelect}
                pageSize={8}
            />

            {/* SearchResultModal */}
            <SearchResultModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                entityType={detailEntityType}
                entityId={detailEntityId}
            />

            {/* Modal yêu cầu đăng nhập */}
            <RequireLoginModal
                open={loginRequiredOpen}
                onClose={() => setLoginRequiredOpen(false)}
                message="Bạn cần đăng nhập để xem toàn bộ lịch sử tra cứu."
            />

            {tourStep > 0 && (
                <TooltipOverlay
                    targetSelector={
                        tourStep === 1
                            ? "#search-input"
                            : tourStep === 2
                            ? "#word-of-the-day-card"
                            : "#explore-categories-section"
                    }
                    title={
                        tourStep === 1
                            ? "🔍 1. Tìm kiếm nhanh"
                            : tourStep === 2
                            ? "☀️ 2. Từ vựng mỗi ngày"
                            : "📚 3. Luyện thi & Chủ đề"
                    }
                    description={
                        tourStep === 1
                            ? "Nhập từ khóa tiếng Nhật (Romaji, Kana, Kanji) hoặc nghĩa tiếng Việt tại đây để tra từ điển nhanh chóng."
                            : tourStep === 2
                            ? "Javi đề xuất một từ vựng hay mỗi ngày kèm âm thanh và ví dụ sinh động giúp bạn tích lũy từ mới."
                            : "Khám phá kho từ vựng ôn thi JLPT từ N5 đến N1 hoặc ôn từ vựng theo các chủ đề du lịch, ẩm thực, công sở."
                    }
                    onNext={() => {
                        if (tourStep < 3) {
                            setTourStep(tourStep + 1);
                        } else {
                            localStorage.setItem("javi_onboarding_seen", "true");
                            setTourStep(0);
                        }
                    }}
                    onSkip={() => {
                        localStorage.setItem("javi_onboarding_seen", "true");
                        setTourStep(0);
                    }}
                    isLast={tourStep === 3}
                    tourStep={tourStep}
                />
            )}
        </div>
    );
}

interface TooltipOverlayProps {
    targetSelector: string;
    title: string;
    description: string;
    onNext: () => void;
    onSkip: () => void;
    isLast: boolean;
    tourStep: number;
}

function TooltipOverlay({
    targetSelector,
    title,
    description,
    onNext,
    onSkip,
    isLast,
    tourStep,
}: TooltipOverlayProps) {
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        width: number;
        height: number;
    } | null>(null);

    useEffect(() => {
        const updateCoords = () => {
            const el = document.querySelector(targetSelector);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                });
            } else {
                setCoords(null);
            }
        };

        const timer = setTimeout(updateCoords, 100);

        window.addEventListener("resize", updateCoords);
        window.addEventListener("scroll", updateCoords);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateCoords);
            window.removeEventListener("scroll", updateCoords);
        };
    }, [targetSelector, tourStep]);

    if (!coords) return null;

    const isCloseToBottom = coords.top + coords.height + 200 > document.documentElement.scrollHeight;
    const bubbleTop = isCloseToBottom 
        ? coords.top - 180 
        : coords.top + coords.height + 12;

    const bubbleStyle: React.CSSProperties = {
        position: "absolute",
        top: bubbleTop,
        left: Math.max(
            16,
            Math.min(window.innerWidth - 320, coords.left + coords.width / 2 - 150)
        ),
        width: 290,
        zIndex: 10000,
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 pointer-events-auto"
                style={{ zIndex: 9998 }}
                onClick={onSkip}
            />

            <div
                className="absolute border-2 border-solid border-primary rounded-2xl pointer-events-none transition-all duration-300"
                style={{
                    top: coords.top - 6,
                    left: coords.left - 6,
                    width: coords.width + 12,
                    height: coords.height + 12,
                    zIndex: 9999,
                    boxShadow:
                        "0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 15px rgba(4, 81, 211, 0.5)",
                }}
            />

            <div
                className="bg-surface-container-lowest text-on-surface rounded-2xl p-5 shadow-xl border border-solid border-outline-variant/30 flex flex-col gap-3 transition-all duration-300"
                style={bubbleStyle}
            >
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-primary m-0 text-sm">{title}</h4>
                    <span className="text-[11px] text-outline font-semibold">
                        Bước {tourStep}/3
                    </span>
                </div>
                <p className="m-0 text-xs text-on-surface-variant leading-relaxed">
                    {description}
                </p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-solid border-outline-variant/10">
                    <button
                        onClick={onSkip}
                        className="bg-transparent border-none text-xs text-outline hover:text-on-surface-variant font-bold cursor-pointer p-0"
                    >
                        Bỏ qua
                    </button>
                    <button
                        onClick={onNext}
                        className="bg-primary hover:bg-primary-container text-white border-none text-xs px-4 py-1.5 rounded-full font-bold cursor-pointer transition-colors shadow-sm"
                    >
                        {isLast ? "Hoàn thành" : "Tiếp theo"}
                    </button>
                </div>
            </div>
        </>
    );
}
