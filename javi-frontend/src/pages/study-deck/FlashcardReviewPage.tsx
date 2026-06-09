import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Progress, Spin, Result, message } from "antd";
import { ArrowLeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { callGetCardsForReview, callSubmitReview } from "@/apis/flashcardApi";
import { callGetMyDecks } from "@/apis/studyDeckApi";
import { IFlashcardResponse, IStudyDeckResponse } from "@/types/backend";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { toRomaji } from "wanakana";

export default function FlashcardReviewPage() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    
    const [cards, setCards] = useState<IFlashcardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // List of decks for left sidebar switcher
    const [decks, setDecks] = useState<IStudyDeckResponse[]>([]);
    const [loadingDecks, setLoadingDecks] = useState(false);

    const fetchDecks = async () => {
        setLoadingDecks(true);
        try {
            const res = await callGetMyDecks();
            setDecks(res.data?.result || []);
        } catch (err) {
            console.error("Lỗi lấy danh sách sổ tay:", err);
        } finally {
            setLoadingDecks(false);
        }
    };

    const fetchCards = async () => {
        if (!deckId) return;
        setLoading(true);
        try {
            const res = await callGetCardsForReview(Number(deckId));
            setCards(res.data?.result || []);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (err: any) {
            console.error("Lỗi lấy thẻ ôn tập:", err);
            toast.error("Không thể tải danh sách thẻ ôn tập!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    useEffect(() => {
        fetchCards();
    }, [deckId]);

    const handleRating = async (rating: number) => {
        if (submitting || currentIndex >= cards.length) return;
        
        setSubmitting(true);
        const currentCard = cards[currentIndex];
        
        try {
            await callSubmitReview({
                cardId: currentCard.id,
                rating,
            });
            
            setIsFlipped(false);
            // Đợi hiệu ứng lật thẻ quay lại mặt trước rồi mới đổi content (tránh lộ mặt sau của thẻ tiếp theo quá sớm)
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setSubmitting(false);
            }, 300);
            
        } catch (err: any) {
            console.error("Lỗi gửi kết quả ôn tập:", err);
            toast.error("Cập nhật lịch ôn tập thất bại!");
            setSubmitting(false);
        }
    };

    const speakText = (text: string) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ja-JP";
            window.speechSynthesis.speak(utterance);
        } else {
            message.warning("Trình duyệt không hỗ trợ phát âm!");
        }
    };

    const activeDeckName = decks.find((d) => d.id === Number(deckId))?.name || "Sổ tay học tập";

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <Spin indicator={<LoadingOutlined className="text-4xl text-primary" spin />} />
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    // Lấy text hiển thị ở mặt trước
    const getFrontText = () => {
        if (!currentCard) return "";
        if (currentCard.vocab) return currentCard.vocab.word;
        if (currentCard.kanji) return currentCard.kanji.characterName;
        if (currentCard.grammar) return currentCard.grammar.pattern;
        return currentCard.frontText || "—";
    };

    // Hàm render nội dung mặt sau của thẻ tương ứng loại thẻ
    const renderCardBackContent = () => {
        if (!currentCard) return null;
        
        if (currentCard.vocab) {
            const vocab = currentCard.vocab;
            return (
                <div className="space-y-3 w-full text-left">
                    <div className="text-center bg-primary-fixed/25 py-2.5 px-4 rounded-xl border border-primary/5">
                        <span className="text-outline text-xs block font-semibold">Cách đọc</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-base font-bold text-on-surface font-mplus">
                                {vocab.hiragana || vocab.katakana}
                                {(vocab.hiragana || vocab.katakana) && ` (${toRomaji(vocab.hiragana || vocab.katakana || "")})`}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(vocab.hiragana || vocab.katakana || vocab.word);
                                }}
                                className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-200"
                            >
                                <span className="material-symbols-outlined text-sm">volume_up</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <span className="text-outline text-xs block mb-1 font-semibold">Nghĩa tiếng Việt</span>
                        {vocab.meanings && vocab.meanings.length > 0 ? (
                            vocab.meanings.slice(0, 2).map((m, idx) => (
                                <div key={m.id || idx} className="mb-3">
                                    <div
                                        className="text-[15px] text-on-surface font-semibold ql-render"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.meaningVn || "") }}
                                    />
                                    {m.examples && m.examples.length > 0 && (
                                        <div className="bg-surface-container-low p-3 rounded-xl mt-1.5 border-l-[3.5px] border-primary flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-on-surface text-sm font-semibold font-mplus m-0">{m.examples[0].jaSentence}</p>
                                                <p className="text-on-surface-variant text-xs font-medium m-0 mt-0.5">{m.examples[0].viSentence}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    speakText(m.examples[0].jaSentence);
                                                }}
                                                className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-200 shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">volume_up</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-outline italic text-sm">Không có giải nghĩa</p>
                        )}
                    </div>
                </div>
            );
        }

        if (currentCard.kanji) {
            const kanji = currentCard.kanji;
            return (
                <div className="space-y-4 w-full text-left">
                    <div className="grid grid-cols-2 gap-2 text-center bg-secondary-fixed/30 p-2.5 rounded-xl border border-secondary-fixed/20">
                        <div>
                            <span className="text-outline text-[11px] block font-semibold uppercase">Âm Hán Việt</span>
                            <span className="font-bold text-secondary text-sm">{kanji.sinoViName || "—"}</span>
                        </div>
                        <div>
                            <span className="text-outline text-[11px] block font-semibold uppercase">Cấp độ JLPT</span>
                            <span className="font-bold text-secondary text-sm">{kanji.level || "—"}</span>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <span className="text-outline text-xs block mb-1 font-semibold">Nghĩa của chữ</span>
                        <div
                            className="text-base text-on-surface font-semibold ql-render leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(kanji.meaning || "") }}
                        />
                    </div>
                </div>
            );
        }

        if (currentCard.grammar) {
            const grammar = currentCard.grammar;
            return (
                <div className="space-y-3.5 w-full text-left">
                    <div className="text-center bg-tertiary-container/10 p-2.5 rounded-xl border border-tertiary-fixed/30">
                        <span className="text-outline text-xs block font-semibold uppercase">Cấp độ ngữ pháp</span>
                        <span className="font-bold text-tertiary text-sm">{grammar.level}</span>
                    </div>
                    
                    <div className="pt-2">
                        <span className="text-outline text-xs block mb-1 font-semibold">Ý nghĩa</span>
                        <div
                            className="text-[15px] text-on-surface font-semibold ql-render leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(grammar.meaning || "") }}
                        />
                    </div>
                    
                    {grammar.examples && grammar.examples.length > 0 && (
                        <div className="bg-surface-container-low p-3 rounded-xl border-l-[3.5px] border-tertiary flex items-center justify-between gap-2 mt-2">
                            <div className="flex-1 min-w-0">
                                <span className="text-outline text-[10px] block font-semibold mb-1 uppercase">Ví dụ mẫu</span>
                                <p className="text-on-surface text-sm font-semibold font-mplus m-0">{grammar.examples[0].jaSentence}</p>
                                <p className="text-on-surface-variant text-xs font-medium m-0 mt-0.5">{grammar.examples[0].viSentence}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(grammar.examples[0].jaSentence);
                                }}
                                className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-tertiary hover:text-white transition-colors duration-200 shrink-0"
                            >
                                <span className="material-symbols-outlined text-[14px]">volume_up</span>
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="w-full text-center">
                <span className="text-outline text-xs block mb-2 font-semibold">Giải nghĩa</span>
                <p className="text-base text-on-surface font-semibold whitespace-pre-wrap leading-relaxed">{currentCard.backText || "—"}</p>
            </div>
        );
    };

    const isFinished = currentIndex >= cards.length;
    const progressPercent = cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

    return (
        <div className="w-full px-4 md:px-8 py-6 max-w-[1200px] mx-auto space-y-6">
            {/* Header / Title section */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface tracking-tight">Phiên ôn tập</h1>
                    <p className="font-body-lg text-sm text-on-surface-variant mt-1.5 font-medium">
                        {isFinished ? "Đã hoàn thành phiên hôm nay" : `Hôm nay cần ôn tập: ${cards.length} thẻ ghi nhớ`}
                    </p>
                </div>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/study-decks")}
                    className="border border-outline-variant/30 hover:border-primary hover:text-primary rounded-xl h-10 px-4 font-semibold shadow-sm"
                >
                    Danh sách Sổ tay
                </Button>
            </div>

            {/* Bento Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Deck Selection Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1">
                    <h3 className="text-lg font-bold text-on-surface flex items-center justify-between px-1">
                        Sổ tay của bạn
                        {loadingDecks && <Spin size="small" />}
                    </h3>
                    
                    <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar snap-x snap-mandatory">
                        {decks.map((deck) => {
                            const isActive = deck.id === Number(deckId);
                            const dueCount = deck.reviewCount || 0;
                            
                            return (
                                <div
                                    key={deck.id}
                                    onClick={() => navigate(`/study-decks/${deck.id}/review`)}
                                    className={`snap-start shrink-0 w-[270px] lg:w-full border rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all duration-300 shadow-sm ${
                                        isActive
                                            ? "bg-surface-container-lowest border-primary shadow-md"
                                            : "bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant hover:shadow"
                                    }`}
                                >
                                    {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`text-sm font-bold truncate pr-3 ${isActive ? "text-primary" : "text-on-surface"}`}>
                                            {deck.name}
                                        </h4>
                                    </div>
                                    <div className="flex gap-2">
                                        {dueCount > 0 ? (
                                            <span className="px-2 py-0.5 rounded bg-error-container text-error font-semibold text-[10px] flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error"></span> {dueCount} cần ôn
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-tertiary-container/10 text-tertiary font-semibold text-[10px] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">done_all</span> Đã xong
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-outline font-semibold text-[10px]">
                                            {deck.totalCards || 0} thẻ
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Active Card Review Area */}
                <div className="lg:col-span-8 flex flex-col order-1 lg:order-2 space-y-4">
                    {isFinished ? (
                        <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/10 shadow-md p-8 text-center bg-gradient-to-b from-white to-primary-fixed/10">
                            <Result
                                status="success"
                                title={<span className="font-bold text-on-surface text-2xl font-headline-lg">Đã hoàn thành!</span>}
                                subTitle={
                                    <div className="space-y-1 mt-2 font-medium">
                                        <p className="text-on-surface-variant text-base">Bạn đã ôn tập xong tất cả {cards.length} thẻ ghi nhớ hôm nay.</p>
                                        <p className="text-outline text-sm">Hệ thống đã lưu lại lịch ôn tập và sẽ nhắc nhở bạn vào ngày kế tiếp!</p>
                                    </div>
                                }
                                extra={[
                                    <Button
                                        key="back"
                                        type="primary"
                                        onClick={() => navigate("/study-decks")}
                                        className="bg-primary hover:bg-primary-fixed-variant text-white font-bold h-10 px-5 rounded-xl border-none shadow-sm"
                                    >
                                        Về Trang Sổ tay
                                    </Button>,
                                    <Button
                                        key="redo"
                                        onClick={fetchCards}
                                        className="h-10 px-5 rounded-xl border border-outline-variant/30 hover:border-primary hover:text-primary font-bold shadow-sm"
                                    >
                                        Ôn tập lại
                                    </Button>
                                ]}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Card State Header details */}
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-semibold text-primary bg-primary-fixed/20 px-3.5 py-1.5 rounded-full border border-primary/5">
                                    Đang ôn: {activeDeckName}
                                </span>
                                <div className="flex gap-1 text-on-surface-variant">
                                    <button
                                        onClick={() => speakText(getFrontText())}
                                        className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"
                                        title="Phát âm từ vựng"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">volume_up</span>
                                    </button>
                                </div>
                            </div>

                            {/* 3D Flip Card */}
                            <div 
                                className="relative w-full aspect-[4/3] max-h-[380px] perspective-1000 cursor-pointer group flashcard" 
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`flashcard-inner w-full h-full relative transform-style-3d duration-500 ease-in-out rounded-[24px] shadow-sm ${isFlipped ? "rotate-y-180" : ""}`}>
                                    
                                    {/* MẶT TRƯỚC */}
                                    <div className="absolute inset-0 w-full h-full bg-surface-container-lowest rounded-[24px] border border-outline-variant/10 flex flex-col justify-center items-center backface-hidden p-6 z-20">
                                        <span className="text-outline text-xs uppercase tracking-widest font-bold mb-6">Mặt trước</span>
                                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface font-mplus leading-none mb-4 select-none text-center px-4">
                                            {getFrontText()}
                                        </h2>
                                        {currentCard.vocab?.hiragana && (
                                            <p className="font-body-lg text-sm text-outline font-semibold select-none">
                                                {currentCard.vocab.hiragana} (Click để xem nghĩa)
                                            </p>
                                        )}
                                        <div className="absolute bottom-4 text-outline text-xs flex items-center gap-1.5 font-bold">
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span> Nhấp để lật thẻ
                                        </div>
                                    </div>

                                    {/* MẶT SAU */}
                                    <div className="absolute inset-0 w-full h-full bg-surface-container-lowest rounded-[24px] border border-primary/10 flex flex-col justify-between items-center backface-hidden rotate-y-180 p-6 z-10 overflow-y-auto">
                                        <div className="w-full flex-1 flex flex-col justify-center items-center py-2">
                                            <span className="text-outline text-xs uppercase tracking-widest font-bold mb-4">Mặt sau</span>
                                            
                                            <h3 className="text-2xl font-bold text-primary font-mplus mb-4 select-none">
                                                {getFrontText()}
                                            </h3>

                                            {renderCardBackContent()}
                                        </div>
                                        <div className="text-outline text-xs flex items-center gap-1.5 font-bold mt-2">
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span> Nhấp để quay lại
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Progress bar info */}
                            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 shadow-sm space-y-2">
                                <div className="flex justify-between text-xs text-outline font-semibold">
                                    <span>Tiến trình hôm nay</span>
                                    <span>{progressPercent}% ({currentIndex}/{cards.length})</span>
                                </div>
                                <Progress
                                    percent={progressPercent}
                                    showInfo={false}
                                    strokeColor={{
                                        "0%": "#0451d3",
                                        "100%": "#006951",
                                    }}
                                    trailColor="#f3f3fa"
                                    className="m-0"
                                />
                            </div>

                            {/* SRS Rating Actions (Visible only when flipped) */}
                            <div className={`transition-all duration-300 ${isFlipped ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-2"}`}>
                                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 shadow-md">
                                    <p className="text-center text-outline text-xs font-semibold mb-3">Bạn nhớ từ này ở mức độ nào?</p>
                                    <div className="grid grid-cols-4 gap-2.5 max-w-xl mx-auto">
                                        
                                        {/* Rating 1: Again */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRating(1);
                                            }}
                                            disabled={submitting}
                                            className="flex flex-col items-center justify-center py-3 bg-surface border border-error-container hover:bg-error-container/20 rounded-xl transition-all group active:scale-95 shadow-sm"
                                        >
                                            <span className="font-bold text-sm text-error mb-0.5">Again</span>
                                            <span className="text-[10px] text-outline group-hover:text-error transition-colors font-semibold">&lt; 1m (Quên)</span>
                                        </button>

                                        {/* Rating 2: Hard */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRating(2);
                                            }}
                                            disabled={submitting}
                                            className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/30 hover:bg-surface-container-high rounded-xl transition-all group active:scale-95 shadow-sm"
                                        >
                                            <span className="font-bold text-sm text-on-surface-variant mb-0.5">Hard</span>
                                            <span className="text-[10px] text-outline font-semibold">2d (Khó)</span>
                                        </button>

                                        {/* Rating 3: Good */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRating(3);
                                            }}
                                            disabled={submitting}
                                            className="flex flex-col items-center justify-center py-3 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded-xl transition-all group active:scale-95 shadow-md transform hover:-translate-y-0.5"
                                        >
                                            <span className="font-bold text-sm mb-0.5">Good</span>
                                            <span className="text-[10px] opacity-80 font-semibold">4d (Tốt)</span>
                                        </button>

                                        {/* Rating 4: Easy */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRating(4);
                                            }}
                                            disabled={submitting}
                                            className="flex flex-col items-center justify-center py-3 bg-tertiary text-on-tertiary border border-tertiary-fixed hover:bg-tertiary-fixed-dim hover:text-on-tertiary-container rounded-xl transition-all group active:scale-95 shadow-sm"
                                        >
                                            <span className="font-bold text-sm mb-0.5">Easy</span>
                                            <span className="text-[10px] opacity-80 font-semibold">8d (Dễ)</span>
                                        </button>

                                    </div>
                                </div>
                            </div>

                            {/* Instruction prompt when not flipped */}
                            {!isFlipped && (
                                <p className="text-center text-outline text-xs font-semibold animate-bounce mt-2">
                                    Nhấp vào thẻ để lật xem đáp án
                                </p>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
