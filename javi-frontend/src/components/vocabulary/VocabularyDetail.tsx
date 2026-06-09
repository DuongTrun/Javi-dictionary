import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Comment from "@/components/comment/Comment";
import { IVocabResponse, IMeaning } from "@/types/backend";
import { callExplainVocabulary } from "@/apis/vocabularyApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import SaveToDeckModal from "@/components/study-deck/SaveToDeckModal";
import { toRomaji } from "wanakana";
import facebook from "@/assets/facebook.png";
import x from "@/assets/x.png";

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

// Dịch vụ phát âm trình duyệt
const playBrowserTTS = (text: string) => {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    } else {
        toast.warning("Trình duyệt của bạn không hỗ trợ phát âm (TTS).");
    }
};

interface Props {
    data: IVocabResponse;
}

export default function VocabularyDetail({ data }: Props) {
    const user = useAuthStore((state) => state.user);
    const isLoggedIn = !!user;

    const [showExplanation, setShowExplanation] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [canRetry, setCanRetry] = useState(true);
    const [saveModalOpen, setSaveModalOpen] = useState(false);

    // Reset explanation state when vocab changes
    useEffect(() => {
        setShowExplanation(false);
        setDisplayedText("");
        setExplanation("");
        setLoading(false);
        setCanRetry(true);
    }, [data.id]);

    const handleExplain = async () => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để xem giải thích chi tiết.");
            setShowExplanation(true);
            return;
        }

        if (loading || !canRetry) return;

        if (explanation) {
            setShowExplanation(true);
            return;
        }

        setShowExplanation(true);
        setDisplayedText("");
        setExplanation("");
        setLoading(true);
        setCanRetry(false);

        try {
            const res = await callExplainVocabulary(data.word);
            setExplanation(res.data.result || "");
        } catch (err: any) {
            console.error("Lỗi khi gọi AI giải thích:", err);
            toast.error(
                err?.response?.data?.message ||
                    "Không thể giải thích từ vựng. Vui lòng thử lại!"
            );
            setTimeout(() => setCanRetry(true), 5000);
        } finally {
            setLoading(false);
            if (!explanation) setCanRetry(true);
        }
    };

    // Hiệu ứng typing
    useEffect(() => {
        if (!showExplanation || !isLoggedIn || !explanation) {
            setDisplayedText("");
            return;
        }

        let currentIndex = 0;
        const intervalId = setInterval(() => {
            if (currentIndex < explanation.length) {
                setDisplayedText((prev) => prev + explanation[currentIndex]);
                currentIndex++;
            } else {
                clearInterval(intervalId);
            }
        }, 12);

        return () => clearInterval(intervalId);
    }, [showExplanation, explanation, isLoggedIn]);

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
        <div className="flex flex-col gap-stack-lg">
            {/* Main Word Card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-card border border-outline-variant/10 p-6 md:p-8 flex flex-col gap-6">
                
                {/* Header Area: Badges & Word Title */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                            {data.wordType && (
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-label-md text-xs font-semibold">
                                    {wordTypeMap[data.wordType] ?? "Khác"}
                                </span>
                            )}
                            {data.level && (
                                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-xs font-semibold">
                                    JLPT {data.level}
                                </span>
                            )}
                        </div>
                        
                        <h1 className="font-japanese-display text-japanese-display text-on-surface mt-3 mb-1 font-bold text-4xl md:text-5xl">
                            {data.word}
                        </h1>

                        <div className="flex items-center gap-3 flex-wrap mt-1">
                            {data.hiragana && (
                                <span className="font-japanese-body text-japanese-body text-on-surface-variant text-base">
                                    {data.hiragana}
                                </span>
                            )}
                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                            {data.hiragana && (
                                <span className="font-body-lg text-body-lg text-outline">
                                    {toRomaji(data.hiragana)}
                                </span>
                            )}
                            {Array.isArray(data.kanjis) && data.kanjis.length > 0 && (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                                    <span className="text-sm text-secondary font-semibold">
                                        Hán-Việt: {data.kanjis.map((k) => k.sinoViName ? k.sinoViName.split(/[,\uFF0C、]/)[0].trim() : "-").join(" ")}
                                    </span>
                                </>
                            )}
                            <button
                                onClick={() => playBrowserTTS(data.word)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary border-none cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">volume_up</span>
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                        <button
                            onClick={handleExplain}
                            disabled={loading || (!canRetry && !explanation)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FF7F50]/10 text-[#FF7F50] hover:bg-[#FF7F50]/20 rounded-full font-label-md text-xs font-semibold transition-colors border border-solid border-[#FF7F50]/20 cursor-pointer disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            {loading ? "Đang phân tích..." : "Giải nghĩa AI"}
                        </button>
                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    toast.info("Vui lòng đăng nhập để lưu vào sổ tay.");
                                } else {
                                    setSaveModalOpen(true);
                                }
                            }}
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-full font-label-md text-xs font-semibold transition-transform hover:-translate-y-0.5 shadow-sm border-none cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">bookmark_add</span>
                            Lưu sổ tay
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShareFacebook}
                                className="w-8 h-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer border-none p-0 flex items-center justify-center bg-transparent"
                                title="Chia sẻ Facebook"
                            >
                                <img src={facebook} alt="facebook" className="w-6 h-6 object-cover" />
                            </button>
                            <button
                                onClick={handleShareX}
                                className="w-8 h-8 rounded-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer border-none p-0 flex items-center justify-center bg-transparent"
                                title="Chia sẻ X"
                            >
                                <img src={x} alt="x" className="w-6 h-6 object-cover" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meanings & Examples Panel */}
                <div className="space-y-6">
                    {Array.isArray(data.meanings) && data.meanings.length > 0 ? (
                        data.meanings.map((m: IMeaning, idx: number) => {
                            const rawHtml = m.meaningVn || "";
                            const cleanedHtml = cleanHanhVietMeaning(rawHtml);
                            const sanitized = formatMeaningHtml(DOMPurify.sanitize(cleanedHtml));
                            
                            // Check if explanation has examples
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = sanitized;
                            const plainText = tempDiv.textContent || "";
                            const isLong = plainText.length > 250;

                            return (
                                <div key={m.id ?? idx} className="space-y-4">
                                    <div className="border-l-4 border-secondary pl-4 py-1.5">
                                        <MeaningBlock sanitizedHtml={sanitized} isLong={isLong} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-outline italic">Không có giải nghĩa cho từ vựng này.</p>
                    )}
                </div>

                {/* AI Explanation block (typed or loading) */}
                {showExplanation && (
                    <div className="bg-[#FF7F50]/5 border border-solid border-[#FF7F50]/20 rounded-2xl p-5 text-on-surface leading-relaxed text-sm md:text-base transition-all duration-300">
                        {loading ? (
                            <div className="flex items-center gap-3 text-on-surface-variant italic">
                                <span className="material-symbols-outlined animate-spin text-[#FF7F50]">sync</span>
                                <span>AI đang phân tích từ vựng `{data.word}`...</span>
                            </div>
                        ) : isLoggedIn ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#FF7F50] font-bold text-sm mb-2">
                                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                                    <span>Giải thích thông minh từ AI</span>
                                </div>
                                <p className="m-0 whitespace-pre-wrap">{displayedText}</p>
                            </div>
                        ) : (
                            <div className="text-on-surface-variant">
                                <Link to="/login" className="underline hover:text-primary font-semibold">
                                    Đăng nhập để xem giải thích chi tiết bằng AI
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Kanji Decomposition Section */}
            {Array.isArray(data.kanjis) && data.kanjis.length > 0 && (
                <div>
                    <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4 font-bold text-lg md:text-xl">
                        Cấu tạo Kanji
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.kanjis.map((k) => (
                            <div key={k.id} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-5 flex gap-4">
                                <div className="w-20 h-20 bg-surface-container-low rounded-xl flex items-center justify-center flex-shrink-0 relative">
                                    <span className="font-japanese-display text-on-surface" style={{ fontSize: "40px", opacity: 0.2 }}>
                                        {k.characterName}
                                    </span>
                                    <span className="font-japanese-display text-primary absolute" style={{ fontSize: "40px" }}>
                                        {k.characterName}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <h4 className="font-headline-md text-base font-bold text-on-surface m-0">{k.characterName}</h4>
                                        <span className="font-body-md text-sm text-secondary font-bold uppercase">{k.sinoViName || "—"}</span>
                                    </div>
                                    <p className="font-body-md text-xs text-on-surface-variant mt-1 truncate" title={k.meaning}>
                                        Ý nghĩa: {k.meaning || "—"}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {k.level && (
                                            <span className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-bold text-primary">
                                                Cấp độ: {k.level}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comment Section */}
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

// === Helper function to clean capitalized Hán-Việt prefix ===
function cleanHanhVietMeaning(html: string): string {
    if (!html) return "";
    let cleaned = html.trim();
    const regex = /^(<[^>]+>)?\s*•?\s*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĐẰẮẲẴẶẦẤẨẪẬỀẾỂỄỆỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\s]{3,})\s+(?=\d+\.|\d|•|\(|[a-zà-ỹ])/;
    const match = cleaned.match(regex);
    if (match) {
        const prefix = match[1] || "";
        cleaned = prefix + cleaned.substring(match[0].length).trim();
    }
    // Xóa thêm dấu chấm tròn ở đầu nếu có mà không đi kèm Hán Việt
    cleaned = cleaned.replace(/^(<[^>]+>)?\s*•\s*/, "$1");
    return cleaned;
}

// === Helper function to dynamically wrap numbered meanings on new lines ===
function formatMeaningHtml(html: string): string {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const walk = (node: Node) => {
        const children = Array.from(node.childNodes);
        for (const child of children) {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.nodeValue || "";
                const regex = /\s+([2-9]\d*\.\s+)/g;
                if (regex.test(text)) {
                    regex.lastIndex = 0;
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const matchIndex = match.index;
                        if (matchIndex > lastIndex) {
                            fragment.appendChild(
                                document.createTextNode(
                                    text.substring(lastIndex, matchIndex)
                                )
                            );
                        }
                        fragment.appendChild(document.createElement("br"));
                        fragment.appendChild(document.createTextNode(match[1]));
                        lastIndex = regex.lastIndex;
                    }
                    if (lastIndex < text.length) {
                        fragment.appendChild(
                            document.createTextNode(text.substring(lastIndex))
                        );
                    }
                    node.replaceChild(fragment, child);
                }
            } else {
                walk(child);
            }
        }
    };

    walk(tempDiv);
    return tempDiv.innerHTML;
}

// === Sub-component: Hiển thị nghĩa từ với khả năng thu gọn / mở rộng ===
function MeaningBlock({ sanitizedHtml, isLong }: { sanitizedHtml: string; isLong: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const truncatedHtml = (() => {
        if (!isLong || expanded) return sanitizedHtml;
        const parts = sanitizedHtml.split(/<br\s*\/?>/gi);
        let accumulated = "";
        let charCount = 0;
        for (const part of parts) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = part;
            const partTextLen = (tempDiv.textContent || "").length;
            if (charCount + partTextLen > 250 && accumulated) break;
            accumulated += (accumulated ? "<br/>" : "") + part;
            charCount += partTextLen;
        }
        return accumulated + " ...";
    })();

    return (
        <div>
            <h3 className="m-0 text-lg text-on-surface font-semibold leading-relaxed">
                <span
                    className="ql-render"
                    dangerouslySetInnerHTML={{ __html: isLong && !expanded ? truncatedHtml : sanitizedHtml }}
                />
            </h3>
            {isLong && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs text-primary hover:underline transition-colors cursor-pointer border-none bg-transparent p-0"
                >
                    {expanded ? "▲ Thu gọn" : "▼ Xem thêm..."}
                </button>
            )}
        </div>
    );
}
