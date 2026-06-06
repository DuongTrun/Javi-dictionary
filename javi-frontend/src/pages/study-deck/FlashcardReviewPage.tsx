import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Progress, Spin, Result } from "antd";
import { ArrowLeftOutlined, SmileOutlined, RedoOutlined, SwapOutlined, LoadingOutlined } from "@ant-design/icons";
import { callGetCardsForReview, callSubmitReview } from "@/apis/flashcardApi";
import { IFlashcardResponse } from "@/types/backend";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";

export default function FlashcardReviewPage() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    
    const [cards, setCards] = useState<IFlashcardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
            
            // Chuyển sang thẻ tiếp theo
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <Spin indicator={<LoadingOutlined className="text-4xl text-blue-600" spin />} />
            </div>
        );
    }

    // Nếu không có thẻ nào cần ôn tập
    if (cards.length === 0) {
        return (
            <div className="max-w-lg mx-auto py-16 px-4">
                <Card className="rounded-2xl border border-gray-100 shadow-md text-center p-6">
                    <Result
                        icon={<SmileOutlined className="text-green-500 text-6xl" />}
                        title={<span className="font-bold text-gray-800 text-2xl">Tuyệt vời!</span>}
                        subTitle={<span className="text-gray-500 text-base">Hôm nay bạn không có thẻ nào cần ôn tập trong sổ tay này.</span>}
                        extra={[
                            <Button
                                key="back"
                                type="primary"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/study-decks")}
                                className="bg-blue-600 hover:bg-blue-700 h-10 px-5 rounded-lg border-none"
                            >
                                Quay lại danh sách Sổ tay
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    // Nếu đã hoàn thành ôn tập toàn bộ thẻ trong danh sách hôm nay
    const isFinished = currentIndex >= cards.length;
    if (isFinished) {
        return (
            <div className="max-w-lg mx-auto py-16 px-4">
                <Card className="rounded-2xl border border-gray-100 shadow-md text-center p-6 bg-gradient-to-b from-white to-blue-50">
                    <Result
                        status="success"
                        title={<span className="font-bold text-gray-800 text-2xl">Đã hoàn thành!</span>}
                        subTitle={
                            <div className="space-y-1">
                                <p className="text-gray-600 text-base">Bạn đã ôn tập xong tất cả {cards.length} thẻ ghi nhớ hôm nay.</p>
                                <p className="text-gray-400 text-sm">Hệ thống đã lưu lại lịch ôn tập và sẽ nhắc bạn vào ngày kế tiếp!</p>
                            </div>
                        }
                        extra={[
                            <Button
                                key="back"
                                type="primary"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/study-decks")}
                                className="bg-blue-600 hover:bg-blue-700 h-10 px-5 rounded-lg border-none mr-2"
                            >
                                Danh sách Sổ tay
                            </Button>,
                            <Button
                                key="redo"
                                icon={<RedoOutlined />}
                                onClick={fetchCards}
                                className="h-10 px-5 rounded-lg hover:border-blue-500 hover:text-blue-500"
                            >
                                Ôn tập lại
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    // Hàm render nội dung mặt sau của thẻ tương ứng loại thẻ
    const renderCardBackContent = () => {
        if (currentCard.vocab) {
            const vocab = currentCard.vocab;
            return (
                <div className="space-y-3 w-full text-left">
                    <div className="text-center">
                        <span className="text-gray-400 text-sm block">Cách đọc:</span>
                        <span className="text-lg font-medium text-gray-800 font-mplus">{vocab.hiragana || vocab.katakana}</span>
                        {vocab.romaji && <span className="text-gray-400 text-sm block italic">({vocab.romaji})</span>}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                        <span className="text-gray-400 text-sm block mb-1">Nghĩa và ví dụ:</span>
                        {vocab.meanings && vocab.meanings.length > 0 ? (
                            vocab.meanings.slice(0, 2).map((m, idx) => (
                                <div key={m.id || idx} className="mb-2">
                                    <div
                                        className="text-base text-gray-800 font-medium ql-render"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.meaningVn || "") }}
                                    />
                                    {m.examples && m.examples.length > 0 && (
                                        <div className="bg-gray-50 p-2 rounded mt-1 text-sm border-l-2 border-blue-400">
                                            <p className="text-gray-800 m-0 font-mplus">{m.examples[0].jaSentence}</p>
                                            <p className="text-gray-500 m-0 text-xs">{m.examples[0].viSentence}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-sm">Không có giải nghĩa</p>
                        )}
                    </div>
                </div>
            );
        }

        if (currentCard.kanji) {
            const kanji = currentCard.kanji;
            return (
                <div className="space-y-4 w-full text-left">
                    <div className="grid grid-cols-2 gap-2 text-center bg-purple-50 p-2 rounded-lg">
                        <div>
                            <span className="text-gray-400 text-xs block">Hán Việt</span>
                            <span className="font-bold text-purple-700 text-sm">{kanji.sinoViName}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs block">Mức độ</span>
                            <span className="font-bold text-purple-700 text-sm">{kanji.level || "—"}</span>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                        <span className="text-gray-400 text-sm block mb-1">Nghĩa chính:</span>
                        <div
                            className="text-base text-gray-800 font-medium ql-render"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(kanji.meaning || "") }}
                        />
                    </div>
                </div>
            );
        }

        if (currentCard.grammar) {
            const grammar = currentCard.grammar;
            return (
                <div className="space-y-3 w-full text-left">
                    <div className="text-center bg-orange-50 p-2 rounded-lg">
                        <span className="text-gray-400 text-xs block">Cấp độ</span>
                        <span className="font-bold text-orange-700 text-sm">{grammar.level}</span>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                        <span className="text-gray-400 text-sm block mb-1">Ý nghĩa:</span>
                        <div
                            className="text-base text-gray-800 font-medium ql-render"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(grammar.meaning || "") }}
                        />
                    </div>
                    
                    {grammar.examples && grammar.examples.length > 0 && (
                        <div className="border-t border-gray-100 pt-2 bg-gray-50 p-2 rounded text-sm border-l-2 border-orange-400">
                            <span className="text-gray-400 text-xs block">Ví dụ mẫu:</span>
                            <p className="text-gray-800 m-0 font-mplus mt-0.5">{grammar.examples[0].jaSentence}</p>
                            <p className="text-gray-500 m-0 text-xs">{grammar.examples[0].viSentence}</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="w-full text-center">
                <span className="text-gray-400 text-sm block mb-2">Đáp án:</span>
                <p className="text-lg text-gray-800 font-medium whitespace-pre-wrap">{currentCard.backText || "—"}</p>
            </div>
        );
    };

    // Lấy text hiển thị ở mặt trước
    const getFrontText = () => {
        if (currentCard.vocab) return currentCard.vocab.word;
        if (currentCard.kanji) return currentCard.kanji.characterName;
        if (currentCard.grammar) return currentCard.grammar.pattern;
        return currentCard.frontText || "—";
    };

    const progressPercent = Math.round((currentIndex / cards.length) * 100);

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
            {/* Header / Back button */}
            <div className="flex items-center justify-between">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/study-decks")}
                    className="border-none bg-white hover:bg-gray-100 shadow-sm rounded-xl h-10 px-4"
                >
                    Danh sách Sổ tay
                </Button>
                <span className="text-gray-400 text-sm">
                    Thẻ {currentIndex + 1} / {cards.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>Tiến trình hôm nay</span>
                    <span>{progressPercent}% ({currentIndex}/{cards.length})</span>
                </div>
                <Progress
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor={{
                        "0%": "#3e66d4",
                        "100%": "#10b981",
                    }}
                    trailColor="#f3f4f6"
                    className="m-0"
                />
            </div>

            {/* Flashcard 3D flip card */}
            <div 
                className="flashcard-container perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transform-style-3d duration-500 ease-in-out ${isFlipped ? "rotate-y-180" : ""}`}>
                    {/* MẶT TRƯỚC */}
                    <div className="absolute inset-0 bg-white rounded-2xl border border-gray-100 shadow-lg p-6 flex flex-col justify-center items-center backface-hidden">
                        <div className="text-center space-y-4">
                            <span className="text-gray-300 text-xs uppercase tracking-wider block font-semibold">Mặt trước</span>
                            <h2 className="text-5xl font-bold text-gray-800 font-mplus select-none break-all px-4">
                                {getFrontText()}
                            </h2>
                            {currentCard.vocab?.hiragana && (
                                <span className="text-gray-300 text-sm block select-none">(Click để xem cách đọc & nghĩa)</span>
                            )}
                        </div>
                        <div className="absolute bottom-4 text-gray-400 text-xs flex items-center gap-1.5 font-medium">
                            <SwapOutlined /> Click để lật thẻ
                        </div>
                    </div>

                    {/* MẶT SAU */}
                    <div className="absolute inset-0 bg-white rounded-2xl border border-gray-100 shadow-lg p-6 flex flex-col justify-between items-center backface-hidden rotate-y-180 overflow-y-auto">
                        <div className="w-full flex-1 flex flex-col justify-center items-center py-2">
                            <span className="text-gray-300 text-xs uppercase tracking-wider block font-semibold mb-2">Mặt sau</span>
                            
                            {/* Từ Kanji chính ở mặt sau để người học tiện đối chiếu */}
                            <h3 className="text-2xl font-bold text-blue-600 font-mplus mb-3">
                                {getFrontText()}
                            </h3>

                            {renderCardBackContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nút bấm đánh giá SRS (chỉ hiển thị khi thẻ đã lật) */}
            <div className={`transition-all duration-300 ${isFlipped ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none translate-y-2"}`}>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-md">
                    <p className="text-center text-gray-500 text-sm mb-3 font-medium">Bạn nhớ từ này ở mức độ nào?</p>
                    <div className="grid grid-cols-4 gap-2">
                        <Button
                            type="primary"
                            danger
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRating(1);
                            }}
                            loading={submitting}
                            className="bg-red-500 hover:bg-red-600 border-none h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs"
                        >
                            <span>Again</span>
                            <span className="text-[10px] font-normal opacity-80">(Quên)</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRating(2);
                            }}
                            loading={submitting}
                            className="bg-amber-500 hover:bg-amber-600 border-none h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs"
                        >
                            <span>Hard</span>
                            <span className="text-[10px] font-normal opacity-80">(Khó)</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRating(3);
                            }}
                            loading={submitting}
                            className="bg-blue-500 hover:bg-blue-600 border-none h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs"
                        >
                            <span>Good</span>
                            <span className="text-[10px] font-normal opacity-80">(Tốt)</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRating(4);
                            }}
                            loading={submitting}
                            className="bg-emerald-500 hover:bg-emerald-600 border-none h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs"
                        >
                            <span>Easy</span>
                            <span className="text-[10px] font-normal opacity-80">(Dễ)</span>
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Hướng dẫn khi chưa lật */}
            {!isFlipped && (
                <p className="text-center text-gray-400 text-sm animate-bounce">
                    Nhấp vào thẻ để lật xem đáp án
                </p>
            )}
        </div>
    );
}
