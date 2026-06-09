import { useEffect, useRef, useState } from "react";
import { Upload, Spin } from "antd";
import { toast } from "react-toastify";
import type { TranslateBlockModel, IGrammarCheckResult } from "@/types/backend";

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

type Props = {
    block: TranslateBlockModel;
    removable?: boolean;
    onChange: (patch: Partial<TranslateBlockModel>) => void;
    onTranslate: (file?: File) => Promise<void>;
    onSwap: () => void;
    onDelete?: () => void;
    onCheckGrammar: () => Promise<void>;
    onClearSnapshot?: () => void;
    isPremium: boolean;
    fillKey?: string | number;
};

export default function TranslateBlock({
    block,
    removable = false,
    onChange,
    onTranslate,
    onSwap,
    onDelete,
    onCheckGrammar,
    onClearSnapshot,
    isPremium,
    fillKey,
}: Props) {
    const canTranslate = !!block.sourceText?.trim() || !!block.file;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const lastTranslatedSnapshotRef = useRef<string | null>(null);
    const lastTranslateAtRef = useRef<number>(0);
    const [localTranslating, setLocalTranslating] = useState(false);

    // trạng thái local cho phân tích ngữ pháp
    const lastCheckedSnapshotRef = useRef<string | null>(null);
    const [grammarLoading, setGrammarLoading] = useState(false);

    const handleFileSelected = async (file?: File | null) => {
        if (!file) return;

        onChange?.({ file });

        if (!isPremium) {
            toast.info("Dịch ảnh chỉ dành cho tài khoản Premium");
            return;
        }

        if (onTranslate) {
            try {
                await onTranslate(file);
            } catch (err) {
                console.error("Lỗi khi gọi onTranslate(file):", err);
            }
        }
    };

    const clearSource = () => {
        onChange({
            sourceText: "",
            translatedText: "",
            file: undefined,
            grammar: null,
        });
        lastCheckedSnapshotRef.current = null;
        onClearSnapshot?.();
    };

    const handleTranslateClick = async () => {
        const current = (block.sourceText ?? "").trim();

        if (!current && !block.file) {
            toast.info("Không có nội dung để dịch.");
            return;
        }

        const now = Date.now();
        const sinceLast = now - (lastTranslateAtRef.current ?? 0);
        if (
            lastTranslatedSnapshotRef.current !== null &&
            lastTranslatedSnapshotRef.current === current &&
            sinceLast < 2000
        ) {
            toast.info("Nội dung đã được dịch gần đây.");
            return;
        }

        if (localTranslating || block.loading) return;

        try {
            setLocalTranslating(true);
            await onTranslate();
            lastTranslatedSnapshotRef.current = current;
            lastTranslateAtRef.current = Date.now();
        } catch (err) {
            console.error("Lỗi khi dịch:", err);
        } finally {
            setLocalTranslating(false);
        }
    };

    const handleCheckGrammarClick = async () => {
        if (grammarLoading) return;

        const cur = (block.sourceText ?? "").trim();
        if (!cur) {
            toast.info("Không có nội dung để phân tích ngữ pháp.");
            return;
        }

        try {
            setGrammarLoading(true);
            await onCheckGrammar();
            lastCheckedSnapshotRef.current = cur;
        } catch (err) {
            console.error("Lỗi khi phân tích ngữ pháp:", err);
            toast.error("Phân tích ngữ pháp thất bại");
        } finally {
            setGrammarLoading(false);
        }
    };

    useEffect(() => {
        if (typeof fillKey !== "undefined") {
            lastTranslatedSnapshotRef.current = (block.sourceText ?? "").trim();
            lastTranslateAtRef.current = Date.now();
            lastCheckedSnapshotRef.current = null;
        }
    }, [fillKey]);

    const isAnalyzeDisabled =
        grammarLoading ||
        (lastCheckedSnapshotRef.current !== null &&
            lastCheckedSnapshotRef.current === (block.sourceText ?? "").trim());

    const renderGrammarInner = (g?: IGrammarCheckResult | null) => {
        if (!g) return null;

        const count = Array.isArray(g.suggest) ? g.suggest.length : 0;
        const isPerfect =
            g.isValidGrammar === true ||
            (Array.isArray(g.suggest) && g.suggest.length === 0);

        if (isPerfect) {
            return (
                <div className="border border-solid rounded-xl bg-emerald-50 border-emerald-200 p-5 shadow-sm mt-4">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                        <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                        <span>Đúng ngữ pháp</span>
                    </div>
                    <p className="m-0 text-emerald-700 text-sm">
                        Đoạn văn đúng văn phong ngữ pháp — không cần sửa.
                    </p>
                </div>
            );
        }

        return (
            <div className="border border-solid rounded-xl bg-error-container/20 border-error/20 p-5 shadow-sm mt-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-error font-bold text-sm">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span>Gợi ý sửa lỗi ngữ pháp ({count} lỗi)</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {Array.isArray(g.suggest) && g.suggest.length > 0 && (
                        <div className="space-y-3">
                            {g.suggest.map((s, idx) => (
                                <div key={idx} className="bg-surface-container-lowest p-3 rounded-lg border border-solid border-outline-variant/10 text-xs md:text-sm">
                                    <div className="text-on-surface-variant line-through">
                                        Ban đầu: <strong>{s.original}</strong>
                                    </div>
                                    <div className="text-tertiary mt-1 font-semibold">
                                        Gợi ý sửa: <strong>{s.corrected}</strong>
                                    </div>
                                    {s.explanation && (
                                        <div className="text-on-surface-variant text-[12px] mt-1 italic">
                                            Giải thích: {s.explanation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {g.result && (
                        <div>
                            <span className="text-xs text-on-surface-variant font-bold block mb-1">Đoạn văn hoàn chỉnh đã sửa:</span>
                            <div className="whitespace-pre-wrap bg-surface-container-low border border-solid border-outline-variant/10 rounded-lg p-3 text-sm font-japanese-body text-on-surface">
                                {g.result}
                            </div>
                        </div>
                    )}

                    {g.mean && (
                        <div>
                            <span className="text-xs text-on-surface-variant font-bold block mb-1">Giải thích tổng quan:</span>
                            <p className="text-sm text-on-surface-variant m-0 leading-relaxed">
                                {g.mean}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full font-body-md text-on-surface antialiased">
            {/* Split Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-md lg:gap-gutter relative">
                
                {/* SOURCE PANEL */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-solid border-outline-variant/10 flex flex-col overflow-hidden h-[320px] lg:h-[400px]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-solid border-outline-variant/10 bg-surface">
                        <select
                            value={block.sourceLang}
                            onChange={(e) => {
                                const val = e.target.value as "ja" | "vi";
                                const other = val === "ja" ? "vi" : "ja";
                                onChange({ sourceLang: val, targetLang: other });
                            }}
                            className="bg-transparent border-none text-primary font-label-md text-sm font-bold focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="ja" className="text-on-surface">Tiếng Nhật (Japanese)</option>
                            <option value="vi" className="text-on-surface">Tiếng Việt (Vietnamese)</option>
                        </select>
                        <button
                            onClick={onSwap}
                            aria-label="Swap Languages"
                            className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-transparent border-none cursor-pointer flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-xl">swap_horiz</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto relative">
                        <textarea
                            ref={textareaRef}
                            value={block.sourceText}
                            onChange={(e) => onChange({ sourceText: e.target.value })}
                            className="w-full h-full resize-none border-none bg-transparent font-japanese-body text-base text-on-surface placeholder:text-outline focus:ring-0 p-0 outline-none leading-relaxed"
                            placeholder="Nhập hoặc dán văn bản cần dịch tại đây..."
                        />
                        {block.sourceText && (
                            <button
                                onClick={clearSource}
                                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center border-none cursor-pointer z-10 shadow-sm"
                                title="Xóa nội dung"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 flex items-center justify-between border-t border-solid border-outline-variant/5 bg-surface/50">
                        <div className="flex gap-2">
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    handleFileSelected(file as unknown as File);
                                    return false;
                                }}
                            >
                                <button
                                    type="button"
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors bg-transparent border-none cursor-pointer"
                                    title="Dịch từ ảnh (OCR)"
                                >
                                    <span className="material-symbols-outlined text-[20px]">image</span>
                                </button>
                            </Upload>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-on-surface-variant font-mono">
                                {block.sourceText?.length ?? 0}/5000
                            </span>
                            <button
                                onClick={handleTranslateClick}
                                disabled={!canTranslate || block.loading || localTranslating}
                                className={`px-6 py-2.5 rounded-full font-label-md text-sm font-semibold shadow-sm transition-all border-none cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                    !canTranslate || block.loading || localTranslating
                                        ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                                        : "bg-primary text-on-primary hover:bg-primary-container"
                                }`}
                            >
                                {block.loading || localTranslating ? (
                                    <>
                                        <Spin size="small" />
                                        <span>Đang dịch...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">translate</span>
                                        <span>Dịch</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* TARGET PANEL */}
                <div className="bg-surface-container-low rounded-2xl shadow-sm border border-solid border-outline-variant/10 flex flex-col overflow-hidden h-[320px] lg:h-[400px]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-solid border-outline-variant/10 bg-surface">
                        <select
                            value={block.targetLang}
                            onChange={(e) => {
                                const val = e.target.value as "ja" | "vi";
                                const other = val === "ja" ? "vi" : "ja";
                                onChange({ targetLang: val, sourceLang: other });
                            }}
                            className="bg-transparent border-none text-primary font-label-md text-sm font-bold focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="vi" className="text-on-surface">Tiếng Việt (Vietnamese)</option>
                            <option value="ja" className="text-on-surface">Tiếng Nhật (Japanese)</option>
                        </select>
                        <select
                            value={block.engine}
                            onChange={(e) => onChange({ engine: e.target.value as any })}
                            className="bg-transparent border-none text-on-surface-variant font-label-md text-xs focus:ring-0 cursor-pointer outline-none ml-auto"
                            title="Chọn bộ dịch"
                        >
                            <option value="GOOGLE" className="text-on-surface">Dịch thường</option>
                            <option value="AI" className="text-on-surface">Dịch AI 🤖</option>
                        </select>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {block.translatedText ? (
                            <p className="font-japanese-body text-base text-on-surface m-0 leading-relaxed whitespace-pre-wrap">
                                {block.translatedText}
                            </p>
                        ) : (
                            <p className="font-body-lg text-on-surface-variant italic m-0 text-sm">
                                Bản dịch của bạn sẽ hiển thị ở đây...
                            </p>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 flex items-center gap-2 border-t border-solid border-outline-variant/5 bg-surface/50 justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (block.translatedText) {
                                        playBrowserTTS(block.translatedText);
                                    }
                                }}
                                disabled={!block.translatedText}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors bg-transparent border-none cursor-pointer disabled:opacity-40"
                                title="Nghe bản dịch"
                            >
                                <span className="material-symbols-outlined text-[20px]">volume_up</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (block.translatedText) {
                                        navigator.clipboard.writeText(block.translatedText);
                                        toast.success("Đã sao chép bản dịch!");
                                    }
                                }}
                                disabled={!block.translatedText}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors bg-transparent border-none cursor-pointer disabled:opacity-40"
                                title="Sao chép bản dịch"
                            >
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                            
                            {block.sourceLang === "ja" && (
                                <button
                                    onClick={handleCheckGrammarClick}
                                    disabled={isAnalyzeDisabled}
                                    className={`flex items-center gap-1 px-3.5 py-1.5 border border-solid rounded-full font-label-md text-xs font-semibold hover:bg-primary/5 transition-colors cursor-pointer bg-transparent ${
                                        isAnalyzeDisabled
                                            ? "border-outline-variant/30 text-on-surface-variant"
                                            : "border-primary text-primary"
                                    }`}
                                >
                                    {grammarLoading ? (
                                        <Spin size="small" />
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">spellcheck</span>
                                    )}
                                    <span>Phân tích ngữ pháp</span>
                                </button>
                            )}
                        </div>

                        {/* Save Flashcard */}
                        <button
                            onClick={() => {
                                if (!block.translatedText) {
                                    toast.info("Không có bản dịch để lưu!");
                                    return;
                                }
                                toast.success(`Đã lưu flashcard thành công!`);
                            }}
                            disabled={!block.translatedText}
                            className="flex items-center gap-1 px-4 py-2 border border-solid border-outline-variant text-primary hover:bg-primary/5 rounded-full font-label-md text-xs font-semibold transition-colors bg-transparent cursor-pointer disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-sm">bookmark_add</span>
                            <span>Lưu Flashcard</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Block deletion control (if multiple blocks exist) */}
            {removable && onDelete && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-full font-label-md text-xs font-semibold border-none cursor-pointer transition-colors"
                    >
                        Xóa bản dịch này
                    </button>
                </div>
            )}

            {/* AI Grammar Correction Section */}
            {renderGrammarInner(block.grammar)}
        </div>
    );
}
