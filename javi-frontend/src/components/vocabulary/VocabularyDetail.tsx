import { useState, useEffect } from "react";
import { PiDiamondFill, PiBookBookmark } from "react-icons/pi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import facebook from "@/assets/facebook.png";
import x from "@/assets/x.png";
import { Link } from "react-router-dom";
import Comment from "@/components/comment/Comment";
import { IVocabResponse, IMeaning } from "@/types/backend";
import { callExplainVocabulary } from "@/apis/vocabularyApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { MdStar } from "react-icons/md";
import SaveToDeckModal from "@/components/study-deck/SaveToDeckModal";

const wordTypeMap: Record<string, string> = {
    NOUN: "Danh từ",
    PRONOUN: "Đại từ",
    ADJECTIVE_I: "Tính từ đuôi -i",
    ADJECTIVE_NA: "Tính từ đuôi -na",
    ADVERB: "Trạng từ",
    PARTICLE: "Trợ từ",
    CONJUNCTION: "Liên từ",
    INTERJECTION: "Thán từ",
    VERB: "Động từ",
    VERB_GROUP_1: "Động từ nhóm 1",
    VERB_GROUP_2: "Động từ nhóm 2",
    VERB_GROUP_3: "Động từ nhóm 3 (Bất quy tắc)",
    AUXILIARY_VERB: "Trợ động từ",
    IDIOM: "Thành ngữ",
    PHRASE: "Cụm từ",
    CUSTOM: "Khác",
};

interface Props {
    data: IVocabResponse;
}

export default function VocabularyDetail({ data }: Props) {
    const user = useAuthStore((state) => state.user);
    const isLoggedIn = !!user;

    const [showExplanation, setShowExplanation] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [typingIndex, setTypingIndex] = useState(0);
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [canRetry, setCanRetry] = useState(true); // Thêm biến để kiểm soát retry
    const [saveModalOpen, setSaveModalOpen] = useState(false);

    // Gọi API giải thích thật (có chặn spam)
    const handleExplain = async () => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để xem giải thích chi tiết.");
            setShowExplanation(true);
            return;
        }

        // Nếu đang loading hoặc đang bị chặn retry, bỏ qua
        if (loading || !canRetry) return;

        // Nếu đã có kết quả thành công → chỉ mở hiển thị, không gọi lại
        if (explanation) {
            setShowExplanation(true);
            return;
        }

        setShowExplanation(true);
        setDisplayedText("");
        setTypingIndex(0);
        setExplanation("");
        setLoading(true);
        setCanRetry(false); // Chặn spam click

        try {
            const res = await callExplainVocabulary(data.word);
            setExplanation(res.data.result || "");
        } catch (err: any) {
            console.error(" Lỗi khi gọi AI giải thích:", err);
            toast.error(
                err?.response?.data?.message ||
                    "Không thể giải thích từ vựng. Vui lòng thử lại!"
            );

            //  Cho phép bấm lại sau 5 giây
            setTimeout(() => setCanRetry(true), 5000);
        } finally {
            setLoading(false);
            // Nếu call thành công → vẫn giữ chặn retry vì đã có dữ liệu
            if (!explanation) setCanRetry(true);
        }
    };

    // Hiệu ứng typing
    useEffect(() => {
        if (showExplanation && isLoggedIn && explanation) {
            if (typingIndex < explanation.length) {
                const timeout = setTimeout(() => {
                    setDisplayedText((prev) => prev + explanation[typingIndex]);
                    setTypingIndex((prev) => prev + 1);
                }, 15);
                return () => clearTimeout(timeout);
            }
        } else {
            setDisplayedText("");
            setTypingIndex(0);
        }
    }, [showExplanation, typingIndex, explanation, isLoggedIn]);

    // Chia sẻ mạng xã hội
    const currentUrl = window.location.href;

    const handleShareFacebook = () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
        )}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    const handleShareX = () => {
        const text = encodeURIComponent("Học từ vựng tiếng Nhật trên Javi:");
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            currentUrl
        )}&text=${text}`;
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
            <h2 className="text-[36px] font-medium text-[#3e67d6] font-mplus">
                {data.word}
            </h2>
            <div className="flex item-center gap-3 mb-2">
                {data.hiragana && (
                    <p className="text-base text-gray-700">{data.hiragana}</p>
                )}

                {/* Hiển thị tên Hán-Việt của các chữ Kanji nếu có */}
                {Array.isArray(data.kanjis) && data.kanjis.length > 0 && (
                    <p className="text-base text-gray-600 mb-2">
                        {/*Lấy tên hán-việt đầu tiên nếu có nhiều tên (tách bởi dấu , 、 hoặc fullwidth comma). Nếu không có sinoViName thì hiện '-' cho chữ đó.*/}
                        「{" "}
                        {data.kanjis
                            .map((k) => {
                                const raw = k.sinoViName;
                                if (!raw) return "-";
                                // tách theo chữ phẩy (bình thường, fullwidth, hoặc dấu Nhật)
                                const first = raw.split(/[,\uFF0C、]/)[0];
                                return first ? first.trim() : "-";
                            })
                            .join(" ")}{" "}
                        」
                    </p>
                )}
            </div>

            {data.wordType && (
                <div className="p-3 text-lg text-[#ad6800] bg-gradient-to-r from-[#ffeecc] to-[#fffdf7] rounded-lg">
                    <MdStar className="inline-block mr-1 mb-1" />
                    {wordTypeMap[data.wordType] ?? "Khác"}
                </div>
            )}

        <div>
                {Array.isArray(data.meanings) && data.meanings.length > 0 ? (
                    data.meanings.map((m: IMeaning, idx: number) => {
                        const rawHtml = m.meaningVn || "";
                        const sanitized = DOMPurify.sanitize(rawHtml);
                        // Lấy text thuần để đếm ký tự
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = sanitized;
                        const plainText = tempDiv.textContent || "";
                        const isLong = plainText.length > 300;

                        return (
                            <MeaningBlock
                                key={m.id ?? idx}
                                sanitizedHtml={sanitized}
                                isLong={isLong}
                            />
                        );
                    })
                ) : (
                    <p className="text-gray-500 italic">
                        Không có nghĩa nào được cung cấp.
                    </p>
                )}
            </div>

            {/* ==== GIẢI THÍCH + CHIA SẺ ==== */}
            <div>
                <div className="mt-3 flex items-center justify-between pb-3">
                    <div className="flex gap-2">
                        <button
                            onClick={handleExplain}
                            disabled={loading || (!canRetry && !explanation)}
                            className="bg-[#ffa800] text-white rounded-xl px-[12px] py-[6px] text-[18px] hover:bg-[#e59400] text-medium transition-all disabled:opacity-60 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin text-[20px]" />
                                    Đang giải thích...
                                </>
                            ) : (
                                `${data.word} là gì?`
                            )}
                        </button>
                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    toast.info("Vui lòng đăng nhập để lưu vào sổ tay.");
                                } else {
                                    setSaveModalOpen(true);
                                }
                            }}
                            className="bg-[#3e66d4] text-white rounded-xl px-[12px] py-[6px] text-[18px] hover:bg-[#2c4fa8] text-medium transition-all flex items-center gap-2"
                        >
                            <PiBookBookmark className="text-[20px]" />
                            Lưu sổ tay
                        </button>
                    </div>

                    <div className="flex gap-2 items-end">
                        <p className="text-sm underline text-gray-500">
                            Chia sẻ với:
                        </p>
                        <button
                            onClick={handleShareX}
                            className="w-6 h-6 rounded-full overflow-hidden"
                        >
                            <img
                                src={x}
                                alt="x"
                                className="w-full h-full object-cover"
                            />
                        </button>
                        <button
                            onClick={handleShareFacebook}
                            className="w-6 h-6 rounded-full overflow-hidden"
                        >
                            <img
                                src={facebook}
                                alt="facebook"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    </div>
                </div>

                {showExplanation && (
                    <div className="bg-[#f1f5fd] border border-[#bcc9e2] rounded-lg p-4 text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 ease-in-out">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500 italic">
                                <AiOutlineLoading3Quarters className="animate-spin text-[18px]" />
                                <span>Đang phân tích...</span>
                            </div>
                        ) : isLoggedIn ? (
                            <p>{displayedText}</p>
                        ) : (
                            <p className="text-gray-700 text-[15px]">
                                <Link
                                    to="/login"
                                    className="underline hover:cursor-pointer"
                                >
                                    Đăng nhập để xem giải thích chi tiết
                                </Link>
                            </p>
                        )}
                    </div>
                )}
            </div>

            <Comment entityType="WORD" entityId={data.id} />

            <SaveToDeckModal
                open={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                vocabId={data.id}
                defaultFrontText={data.word}
                defaultBackText={data.meanings?.[0]?.meaningVn || ""}
            />
        </div>
    );
}

// === Sub-component: Hiển thị nghĩa từ với khả năng thu gọn / mở rộng ===
function MeaningBlock({ sanitizedHtml, isLong }: { sanitizedHtml: string; isLong: boolean }) {
    const [expanded, setExpanded] = useState(false);

    // Cắt HTML thông minh: lấy tối đa 300 ký tự text thuần, nhưng cắt tại ranh giới thẻ <br/>
    const truncatedHtml = (() => {
        if (!isLong || expanded) return sanitizedHtml;
        // Tách theo <br/> hoặc <br> hoặc <br />
        const parts = sanitizedHtml.split(/<br\s*\/?>/gi);
        let accumulated = "";
        let charCount = 0;
        for (const part of parts) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = part;
            const partTextLen = (tempDiv.textContent || "").length;
            if (charCount + partTextLen > 300 && accumulated) break;
            accumulated += (accumulated ? "<br/>" : "") + part;
            charCount += partTextLen;
        }
        return accumulated + " ...";
    })();

    return (
        <div className="mb-4">
            <h3 className="my-3 text-lg flex items-start gap-1 text-[#3e67d6]">
                <PiDiamondFill className="text-[12px] mt-2 flex-shrink-0" />
                <span
                    className="ql-render"
                    dangerouslySetInnerHTML={{ __html: isLong && !expanded ? truncatedHtml : sanitizedHtml }}
                />
            </h3>
            {isLong && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="ml-4 text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                >
                    {expanded ? "▲ Thu gọn" : "▼ Xem thêm..."}
                </button>
            )}
        </div>
    );
}
