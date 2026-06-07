import { useEffect, useRef, useState } from "react";
import { Upload, Button, Spin } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import type { TranslateBlockModel, IGrammarCheckResult } from "@/types/backend";

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

    // refs để đồng bộ chiều cao nội dung
    const sourceOuterRef = useRef<HTMLDivElement | null>(null); 
    const textareaRef = useRef<HTMLTextAreaElement | null>(null); 
    const targetOuterRef = useRef<HTMLDivElement | null>(null); 
    const targetInnerRef = useRef<HTMLDivElement | null>(null); 

    const lastTranslatedSnapshotRef = useRef<string | null>(null);
    const lastTranslateAtRef = useRef<number>(0); // timestamp lần dịch thành công gần nhất
    const [localTranslating, setLocalTranslating] = useState(false);

    const MIN_CONTENT_HEIGHT = 180; // px

    // ---------- trạng thái local cho phân tích ngữ pháp ----------
    const lastCheckedSnapshotRef = useRef<string | null>(null);
    const [grammarLoading, setGrammarLoading] = useState(false);
    // -------------------------------------------------------------

    // -----------------------
    // Chọn file ảnh:
    // - Cập nhật file vào parent ngay
    // - Sau đó gọi handleTranslateClick nhẹ để parent xử lý dịch ảnh
    // -----------------------
    const handleFileSelected = async (file?: File | null) => {
        if (!file) return;

        // Cập nhật file vào parent ngay
        onChange?.({ file });

        // Nếu không phải premium thì thoát sớm — KHÔNG gọi API, KHÔNG gọi onTranslate
        if (!isPremium) {
            toast.info("Dịch ảnh chỉ dành cho tài khoản Premium");
            return;
        }

        // Gọi onTranslate(file) trực tiếp để tránh race khi state parent chưa cập nhật kịp
        if (onTranslate) {
            try {
                await onTranslate(file); // <-- Truyền file trực tiếp
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
        // khi xóa nội dung, coi như chưa phân tích
        lastCheckedSnapshotRef.current = null;

        // Thông báo lên parent để reset snapshot (per-block) — KHÔNG thay đổi layout
        onClearSnapshot?.();
    };

    const renderGrammarInner = (g?: IGrammarCheckResult | null) => {
        if (!g) return null;

        const count = Array.isArray(g.suggest) ? g.suggest.length : 0;
        const isPerfect =
            g.isValidGrammar === true ||
            (Array.isArray(g.suggest) && g.suggest.length === 0);

        // Trường hợp đoạn văn hoàn chỉnh: chỉ hiển thị panel xanh + thông điệp, KHÔNG hiển thị "Đoạn đã sửa" / "Giải thích tổng quan"
        if (isPerfect) {
            return (
                <div className="border rounded-lg bg-green-50 border-green-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <div className="font-medium text-green-700">
                                Kiểm tra ngữ pháp
                            </div>
                            <div className="text-sm text-green-600 mt-1">
                                Đoạn văn đúng văn phong ngữ pháp — không cần
                                sửa.
                            </div>
                        </div>
                        <div className="text-sm text-green-700">
                            0 lỗi đã phát hiện
                        </div>
                    </div>
                </div>
            );
        }

        // Có lỗi/gợi ý: panel đỏ đầy đủ như cũ
        return (
            <div className="border rounded-lg bg-red-50 border-red-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="font-medium text-red-700">
                            Kiểm tra ngữ pháp
                        </div>
                        <div className="text-sm text-red-600">
                            Gợi ý sửa lỗi ngữ pháp, chính tả
                        </div>
                    </div>
                    <div className="text-sm text-red-700">
                        {count} lỗi đã phát hiện
                    </div>
                </div>

                <div className="border-t border-red-100 pt-3">
                    {Array.isArray(g.suggest) && g.suggest.length > 0 && (
                        <ol className="list-decimal list-inside space-y-3 mb-3">
                            {g.suggest.map((s, idx) => (
                                <li
                                    key={idx}
                                    className="flex gap-3 items-start"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm">
                                            <strong>{s.original}</strong>
                                        </div>
                                        <div className="text-sm text-green-700 mt-1">
                                            <strong>→ {s.corrected}</strong>
                                        </div>
                                        {s.explanation && (
                                            <div className="text-sm text-gray-700 mt-1">
                                                {s.explanation}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}

                    {g.result && (
                        <div className="mb-3">
                            <div className="font-medium mb-1">Đoạn đã sửa</div>
                            <div className="whitespace-pre-wrap bg-white border rounded p-2 text-sm">
                                {g.result}
                            </div>
                        </div>
                    )}

                    {g.mean && (
                        <div>
                            <div className="font-medium mb-1">
                                Giải thích tổng quan
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {g.mean}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- tiện ích: resize textarea theo nội dung ---
    const resizeTextareaToContent = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
    };

    // --- core: đồng bộ chiều cao source và target ---
    const syncSourceAndTargetHeights = () => {
        const ta = textareaRef.current;
        const tgtInner = targetInnerRef.current;
        const srcOuter = sourceOuterRef.current;
        const tgtOuter = targetOuterRef.current;
        if (!ta || !tgtInner || !srcOuter || !tgtOuter) return;

        const sourceContentH = Math.max(ta.scrollHeight, MIN_CONTENT_HEIGHT);
        const targetContentH = Math.max(
            tgtInner.scrollHeight,
            MIN_CONTENT_HEIGHT
        );

        const desiredContentH = Math.ceil(
            Math.max(sourceContentH, targetContentH)
        );

        ta.style.height = `${desiredContentH}px`;
        tgtInner.style.minHeight = `${desiredContentH}px`;

        const srcStyle = getComputedStyle(srcOuter);
        const tgtStyle = getComputedStyle(tgtOuter);
        const srcPadTop = parseFloat(srcStyle.paddingTop || "0");
        const srcPadBottom = parseFloat(srcStyle.paddingBottom || "0");
        const tgtPadTop = parseFloat(tgtStyle.paddingTop || "0");
        const tgtPadBottom = parseFloat(tgtStyle.paddingBottom || "0");

        srcOuter.style.minHeight = `${
            desiredContentH + srcPadTop + srcPadBottom
        }px`;
        tgtOuter.style.minHeight = `${
            desiredContentH + tgtPadTop + tgtPadBottom
        }px`;
    };

    // gọi sync khi source/target thay đổi hoặc resize
    useEffect(() => {
        resizeTextareaToContent();
        const raf = requestAnimationFrame(syncSourceAndTargetHeights);
        window.addEventListener("resize", syncSourceAndTargetHeights);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", syncSourceAndTargetHeights);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [block.sourceText, block.translatedText]);

    // --- khi parent "fill" dữ liệu từ lịch sử, parent sẽ đổi fillKey ---
    useEffect(() => {
        if (typeof fillKey !== "undefined") {
            lastTranslatedSnapshotRef.current = (block.sourceText ?? "").trim();
            lastTranslateAtRef.current = Date.now();
            // reset snapshot grammar khi fill từ history
            lastCheckedSnapshotRef.current = null;
        }
    }, [fillKey]);

    // prevent spam: chỉ dịch khi nội dung khác so với snapshot lần dịch thành công
    const handleTranslateClick = async () => {
        const current = (block.sourceText ?? "").trim();

        // Nếu không có text & không có file thì mới chặn
        // Còn THẢ CHO QUA khi current rỗng nhưng block.file vẫn còn (dịch ảnh)
        if (!current) {
            // Nếu vẫn còn file (người dùng vừa chọn ảnh) → cho phép dịch
            if (block.file) {
                // current sẽ được BE lấp đầy sau OCR → không chặn
            } else {
                toast.info("Không có nội dung để dịch.");
                return;
            }
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

            requestAnimationFrame(syncSourceAndTargetHeights);
        } catch (err) {
            console.error("Lỗi khi dịch:", err);
        } finally {
            setLocalTranslating(false);
        }
    };

    // xử lý click "Phân tích"
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
            // lưu snapshot để khóa nút cho đến khi user sửa nội dung
            lastCheckedSnapshotRef.current = cur;
        } catch (err) {
            console.error("Lỗi khi phân tích ngữ pháp:", err);
            toast.error("Phân tích ngữ pháp thất bại");
        } finally {
            setGrammarLoading(false);
        }
    };

    const isAnalyzeDisabled =
        grammarLoading ||
        (lastCheckedSnapshotRef.current !== null &&
            lastCheckedSnapshotRef.current === (block.sourceText ?? "").trim());

    return (
        <div className="w-full">
            <div className="relative w-full">
                {/* mobile header row */}
                <div className="flex gap-4 mb-3 md:hidden">
                    <div className="flex-1">
                        <div className="w-full inline-block bg-white rounded-md px-4 py-2 text-sm border text-center">
                            {block.sourceLang === "ja"
                                ? "Japanese"
                                : "Vietnamese"}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="w-full inline-block bg-blue-600 text-white rounded-md px-4 py-2 text-sm text-center">
                            {block.targetLang === "ja"
                                ? "Japanese"
                                : "Vietnamese"}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                    {/* SOURCE */}
                    <div className="flex-1">
                        <div className="mb-3 hidden md:block">
                            <div className="w-full inline-block bg-white rounded-md px-4 py-2 text-base border text-center">
                                {block.sourceLang === "ja"
                                    ? "Japanese"
                                    : "Vietnamese"}
                            </div>
                        </div>

                        {/* outer wrapper with padding + pb for controls */}
                        <div
                            ref={sourceOuterRef}
                            className="relative min-h-[180px] p-4 pb-24 rounded-lg border bg-white overflow-hidden"
                        >
                            <textarea
                                ref={textareaRef}
                                value={block.sourceText}
                                onChange={(e) => {
                                    onChange({ sourceText: e.target.value });
                                    requestAnimationFrame(
                                        resizeTextareaToContent
                                    );
                                    // khi sửa nội dung, cho phép phân tích lại
                                    // (snapshot so sánh trong isAnalyzeDisabled)
                                }}
                                className="w-full h-full bg-transparent resize-none outline-none"
                                maxLength={5000}
                                aria-label="Văn bản nguồn"
                                style={{ lineHeight: "1.5" }}
                            />

                            {/* clear */}
                            {Boolean(
                                block.sourceText && block.sourceText.length > 0
                            ) && (
                                <button
                                    onClick={clearSource}
                                    title="Xóa văn bản nguồn"
                                    className="absolute right-3 top-3 bg-white rounded-full p-0.5 text-gray-500 hover:text-gray-800 opacity-40 hover:opacity-80 z-20"
                                >
                                    ✕
                                </button>
                            )}

                            {/* bottom toolbar inside source */}
                            <div className="absolute left-3 bottom-4 right-3 flex items-center justify-between z-20">
                                <div>
                                    <Upload
                                        accept="image/*"
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            handleFileSelected(
                                                file as unknown as File
                                            );
                                            return false;
                                        }}
                                    >
                                        <Button
                                            type="text"
                                            icon={
                                                <CameraOutlined
                                                    style={{ fontSize: 18 }}
                                                />
                                            }
                                            title="Dịch ảnh"
                                            aria-label="Dịch ảnh"
                                        />
                                    </Upload>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-sm text-gray-500">{`${
                                        block.sourceText?.length ?? 0
                                    }/5000`}</div>
                                    <button
                                        onClick={handleTranslateClick}
                                        disabled={
                                            !canTranslate ||
                                            block.loading ||
                                            localTranslating
                                        }
                                        className={`px-4 py-2 rounded-md text-white text-sm ${
                                            !canTranslate ||
                                            block.loading ||
                                            localTranslating
                                                ? "bg-gray-300"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                        aria-label="Dịch"
                                        title="Dịch"
                                    >
                                        {block.loading || localTranslating
                                            ? "Đang dịch..."
                                            : "Dịch"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SWAP button */}
                    <div className="flex justify-center md:relative md:flex-none -my-6 md:my-0">
                        <div
                            className="flex items-center justify-center md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-10"
                            style={{ pointerEvents: "none" }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSwap();
                                }}
                                title="Đổi chiều dịch"
                                className="pointer-events-auto w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center z-20"
                                style={{
                                    boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
                                }}
                                aria-label="swap"
                            >
                                <span style={{ fontSize: 18 }}>⇄</span>
                            </button>
                        </div>
                    </div>

                    {/* TARGET */}
                    <div className="flex-1">
                        <div className="mb-3 hidden md:block">
                            <div className="w-full inline-block bg-blue-600 text-white rounded-md px-4 py-2 text-base text-center">
                                {block.targetLang === "ja"
                                    ? "Japanese"
                                    : "Vietnamese"}
                            </div>
                        </div>

                        <div
                            ref={targetOuterRef}
                            className="relative min-h-[180px] p-4 pb-24 rounded-lg border-[0.5px] border-blue-500 bg-white overflow-hidden"
                        >
                            <div ref={targetInnerRef} className="w-full">
                                {block.translatedText ? (
                                    <div className="whitespace-pre-wrap">
                                        {block.translatedText}
                                    </div>
                                ) : (
                                    <div />
                                )}
                            </div>

                            <div className="absolute right-4 bottom-4 z-20">
                                <select
                                    value={block.engine}
                                    onChange={(e) =>
                                        onChange({
                                            engine: e.target.value as any,
                                        })
                                    }
                                    className="px-3 py-1 rounded-md border bg-white text-sm"
                                    aria-label="Chọn engine dịch"
                                    title="Chọn engine dịch"
                                >
                                    <option value="GOOGLE">Dịch thường</option>
                                    <option value="AI">Dịch AI</option>
                                </select>
                            </div>

                            <div className="absolute left-4 bottom-4 z-20">
                                {block.sourceLang === "ja" && (
                                    <button
                                        onClick={async () => {
                                            await handleCheckGrammarClick();
                                        }}
                                        className={`px-3 py-1 rounded-md ${
                                            isAnalyzeDisabled
                                                ? "bg-gray-200 text-gray-700"
                                                : "bg-green-600 text-white hover:bg-green-700"
                                        } text-sm`}
                                        title="Phân tích ngữ pháp"
                                        aria-label="Phân tích ngữ pháp"
                                        disabled={isAnalyzeDisabled}
                                    >
                                        {grammarLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Spin size="small" />{" "}
                                                <span>Phân tích</span>
                                            </span>
                                        ) : (
                                            <span>Phân tích</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* removable control */}
                {removable && onDelete && (
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={onDelete}
                            className="px-3 py-1 rounded-md bg-red-100 text-red-700 border text-sm hover:bg-red-200"
                        >
                            Xóa bản dịch
                        </button>
                    </div>
                )}

                {/* Kết quả ngữ pháp: full width dưới cả 2 ô */}
                <div className="mt-4">{renderGrammarInner(block.grammar)}</div>
            </div>
        </div>
    );
}
