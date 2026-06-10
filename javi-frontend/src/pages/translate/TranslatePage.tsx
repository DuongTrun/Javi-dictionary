import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TranslateBlock from "@/components/translate/TranslateBlock";
import type { TranslateBlockModel } from "@/types/backend";
import {
    callTranslateText,
    callTranslateImage,
    callGetTranslateHistory,
    callCheckGrammar,
    callDeleteSelectedTranslateHistory,
    callDeleteAllTranslateHistory,
    getTranslateStreamUrl,
} from "@/apis/translateApi";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/useAuthStore";
import no_history from "@/assets/no-history.png";
import RequireLoginModal from "@/components/common/RequireLoginModal";

const makeId = () => Math.random().toString(36).slice(2, 10);

export default function TranslatePage() {
    const [blocks, setBlocks] = useState<TranslateBlockModel[]>(() => [
        {
            id: makeId(),
            sourceText: "",
            translatedText: "",
            sourceLang: "ja",
            targetLang: "vi",
            engine: "GOOGLE",
            loading: false,
            file: undefined,
            grammar: null,
        },
    ]);
    const token = useAuthStore((state) => state.token);

    const [requireLoginFor, setRequireLoginFor] = useState<
        "AI" | "GRAMMAR" | null
    >(null);

    const [historyList, setHistoryList] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(0);
    const [historySize] = useState(20);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const historyRef = useRef<HTMLDivElement | null>(null);

    const historyLoadingRef = useRef(false);
    const historyLoadingMoreRef = useRef(false);

    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [fillKeys, setFillKeys] = useState<Record<string, number>>({});

    const isProcessingRef = useRef(false);

    // snapshot per-block: lưu text/engine lần dịch gần nhất theo block id
    const previousTextRefPerBlock = useRef<Record<string, string>>({});
    const previousEngineRefPerBlock = useRef<Record<string, string>>({});
    const lastTranslateAtRefPerBlock = useRef<Record<string, number>>({});

    const fetchHistoryPage = useCallback(
        async (pageToLoad = 0, reset = false) => {
            if (reset) {
                if (historyLoadingRef.current) return;
            } else {
                if (historyLoadingMoreRef.current) return;
            }

            try {
                if (reset) {
                    historyLoadingRef.current = true;
                    setHistoryLoading(true);
                } else {
                    historyLoadingMoreRef.current = true;
                    setHistoryLoadingMore(true);
                }

                const res = await callGetTranslateHistory(
                    pageToLoad,
                    historySize,
                    "createdAt,desc"
                );
                const data = res?.data;
                let list: any[] = [];
                let last = true;
                let backendNumber = pageToLoad;

                if (data?.result?.content) {
                    list = data.result.content;
                    last = data.result.last ?? true;
                    backendNumber = data.result.number ?? pageToLoad;
                } else if (Array.isArray(data?.result)) {
                    list = data.result;
                    last = list.length < historySize;
                    backendNumber = pageToLoad;
                } else if (Array.isArray(data)) {
                    list = data;
                    last = list.length < historySize;
                    backendNumber = pageToLoad;
                } else {
                    if (data?.result) {
                        list = Array.isArray(data.result)
                            ? data.result
                            : [data.result];
                        last = list.length < historySize;
                    }
                }

                setHistoryList((prev) => (reset ? list : [...prev, ...list]));
                setHistoryHasMore(!last);
                setHistoryPage(backendNumber);
            } catch (err) {
                console.error("Lỗi load history:", err);
            } finally {
                if (reset) {
                    historyLoadingRef.current = false;
                    setHistoryLoading(false);
                } else {
                    historyLoadingMoreRef.current = false;
                    setHistoryLoadingMore(false);
                }
            }
        },
        [historySize]
    );

    useEffect(() => {
        if (!token) {
            return;
        }
        fetchHistoryPage(0, true);
    }, [token, fetchHistoryPage]);

    useEffect(() => {
        const onWindowScroll = () => {
            if (!historyHasMore || historyLoadingMoreRef.current) return;

            const threshold = 260;
            const remaining =
                document.documentElement.scrollHeight -
                window.scrollY -
                window.innerHeight;

            if (remaining < threshold) {
                const nextPage = historyPage + 1;
                fetchHistoryPage(nextPage, false);
            }
        };

        window.addEventListener("scroll", onWindowScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onWindowScroll);
        };
    }, [historyHasMore, historyPage, fetchHistoryPage]);

    const addBlock = useCallback((data?: Partial<TranslateBlockModel>) => {
        const id = data?.id ?? makeId();
        setBlocks((prev) => [
            ...prev,
            {
                id,
                sourceText: "",
                translatedText: "",
                sourceLang: "ja",
                targetLang: "vi",
                engine: "GOOGLE",
                loading: false,
                file: undefined,
                grammar: null,
                ...data,
            },
        ]);
        return id;
    }, []);

    const updateBlock = useCallback(
        (id: string, patch: Partial<TranslateBlockModel>) => {
            setBlocks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
            );
        },
        []
    );

    const deleteBlock = useCallback((id: string) => {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
        setFillKeys((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });

        delete previousTextRefPerBlock.current[id];
        delete previousEngineRefPerBlock.current[id];
        delete lastTranslateAtRefPerBlock.current[id];
    }, []);

    const handleTranslate = useCallback(
        async (id: string, file?: File | undefined) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;

            if (blk.engine === "AI" && !token) {
                setRequireLoginFor("AI");
                return;
            }

            if (isProcessingRef.current) return;

            const currentText = (blk.sourceText ?? "").trim();
            const currentEngine = blk.engine ?? "GOOGLE";

            const prevTextForBlock = previousTextRefPerBlock.current[id] ?? "";
            const prevEngineForBlock =
                previousEngineRefPerBlock.current[id] ?? "";

            if (
                typeof file === "undefined" &&
                !blk.file &&
                currentText === prevTextForBlock &&
                currentEngine === prevEngineForBlock
            ) {
                toast.info("Văn bản chưa thay đổi — đã dịch trước đó.");
                return;
            }

            isProcessingRef.current = true;
            updateBlock(id, { loading: true });

            try {
                let translated = "";
                const shouldUseImageBranch =
                    typeof file !== "undefined"
                        ? true
                        : !!blk.file && currentText === prevTextForBlock;

                if (
                    !!blk.file &&
                    !shouldUseImageBranch &&
                    typeof file === "undefined"
                ) {
                    updateBlock(id, { file: undefined });
                }

                if (shouldUseImageBranch && (file ?? blk.file)) {
                    const fileToSend = (file ?? blk.file) as File;

                    const res = await callTranslateImage({
                        file: fileToSend,
                        sourceLang: blk.sourceLang as any,
                        targetLang: blk.targetLang as any,
                        engine: blk.engine,
                    } as any);

                    const r = res?.data?.result;

                    if (typeof r === "string") {
                        translated = r;
                    } else if (r && typeof r.translatedText === "string") {
                        translated = r.translatedText;
                    } else {
                        translated = "";
                    }

                    const returnedSourceText =
                        r && typeof r.sourceText === "string"
                            ? r.sourceText
                            : undefined;
                    const returnedSourceLang =
                        r && r.sourceLang ? (r.sourceLang as any) : undefined;
                    const returnedTargetLang =
                        r && r.targetLang ? (r.targetLang as any) : undefined;

                    updateBlock(id, {
                        translatedText: translated,
                        ...(returnedSourceText !== undefined
                            ? { sourceText: returnedSourceText }
                            : {}),
                        ...(returnedSourceLang !== undefined
                            ? { sourceLang: returnedSourceLang }
                            : {}),
                        ...(returnedTargetLang !== undefined
                            ? { targetLang: returnedTargetLang }
                            : {}),
                    });
                } else if (currentEngine === "AI") {
                    const payload = {
                        sourceText: blk.sourceText ?? "",
                        sourceLang: blk.sourceLang ?? "ja",
                        targetLang: blk.targetLang ?? "vi",
                        engine: "AI",
                    };

                    let accumulatedText = "";
                    await fetchEventSource(getTranslateStreamUrl(), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(payload),
                        async onopen(response) {
                            if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
                                return; // everything is good
                            } else {
                                let errorMsg = "Dịch thất bại";
                                try {
                                    const errorJson = await response.json();
                                    if (errorJson && errorJson.message) {
                                        errorMsg = errorJson.message;
                                    }
                                } catch (e) {
                                    // ignore
                                }
                                throw new Error(errorMsg);
                            }
                        },
                        onmessage(ev) {
                            accumulatedText += ev.data;
                            updateBlock(id, { translatedText: accumulatedText });
                        },
                        onclose() {
                            updateBlock(id, { loading: false });
                            isProcessingRef.current = false;
                        },
                        onerror(err) {
                            console.error("Lỗi stream dịch:", err);
                            throw err;
                        }
                    });
                } else {
                    const payload = {
                        sourceText: blk.sourceText ?? "",
                        sourceLang: blk.sourceLang ?? "ja",
                        targetLang: blk.targetLang ?? "vi",
                        engine: blk.engine ?? "GOOGLE",
                    };

                    const res = await callTranslateText(payload as any);
                    const r = res?.data?.result;

                    if (typeof r === "string") {
                        translated = r;
                    } else if (r && typeof r.translatedText === "string") {
                        translated = r.translatedText;
                    } else {
                        translated = "";
                    }

                    updateBlock(id, { translatedText: translated });
                }

                previousTextRefPerBlock.current[id] = currentText;
                previousEngineRefPerBlock.current[id] = currentEngine;
                lastTranslateAtRefPerBlock.current[id] = Date.now();

                setFillKeys((prev) => ({ ...prev, [id]: Date.now() }));

                if (token) {
                    try {
                        await fetchHistoryPage(0, true);
                    } catch (e) {
                        // ignore
                    }
                }
            } catch (err) {
                toast.error("Dịch thất bại");
            } finally {
                updateBlock(id, { loading: false });
                isProcessingRef.current = false;
            }
        },
        [blocks, updateBlock, fetchHistoryPage, token]
    );

    const handleCheckGrammar = useCallback(
        async (id: string) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;
            if (!token) {
                setRequireLoginFor("GRAMMAR");
                return;
            }
            try {
                const res = await callCheckGrammar({
                    sourceText: blk.sourceText ?? "",
                    targetLang: "vi",
                });
                const grammar = res?.data?.result ?? null;
                updateBlock(id, { grammar });
            } catch (err) {
                toast.error("Kiểm tra ngữ pháp thất bại");
            }
        },
        [blocks, updateBlock, token]
    );

    const handleSwap = useCallback(
        (id: string) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;
            updateBlock(id, {
                sourceLang: blk.targetLang,
                targetLang: blk.sourceLang,
                sourceText: blk.translatedText ?? "",
                translatedText: blk.sourceText ?? "",
            });
            previousTextRefPerBlock.current[id] = "";
            previousEngineRefPerBlock.current[id] = "";
            lastTranslateAtRefPerBlock.current[id] = 0;

            setFillKeys((prev) => ({ ...prev, [id]: Date.now() }));
        },
        [blocks, updateBlock]
    );

    const renderedBlocks = useMemo(() => blocks, [blocks]);

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!token) {
            toast.warning("Vui lòng đăng nhập để xóa lịch sử.");
            return;
        }

        try {
            await callDeleteSelectedTranslateHistory(selectedIds);
            setHistoryList((prev) =>
                prev.filter((it: any) => !selectedIds.includes(it.id))
            );
            setSelectedIds([]);
            setDeleteMode(false);
            fetchHistoryPage(0, true);
        } catch (err) {
            console.error("Lỗi xóa lịch sử đã chọn:", err);
            toast.error("Xóa thất bại");
        }
    };

    const onDeleteAll = async () => {
        if (!token) {
            toast.warning("Vui lòng đăng nhập để xóa lịch sử.");
            return;
        }

        try {
            await callDeleteAllTranslateHistory();
            setHistoryList([]);
            setSelectedIds([]);
            setDeleteMode(false);
            setHistoryHasMore(false);
            toast.success("Đã xóa tất cả lịch sử");
        } catch (err) {
            console.error("Lỗi xóa tất cả lịch sử:", err);
            toast.error("Xóa tất cả thất bại");
        }
    };

    const formatTime = (v?: any) => {
        if (!v && v !== 0) return "";
        try {
            if (typeof v === "string") {
                const d = dayjs(v);
                if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
                return v;
            }

            if (typeof v === "number") {
                const d = dayjs(v);
                if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
                return String(v);
            }

            if (Array.isArray(v)) {
                const [y, m, d, hh = 0, mm = 0, ss = 0] = v.map((x) =>
                    Number(x)
                );
                if (
                    !Number.isFinite(y) ||
                    !Number.isFinite(m) ||
                    !Number.isFinite(d)
                ) {
                    return String(v);
                }
                const dt = dayjs(
                    new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0)
                );
                if (dt.isValid()) return dt.format("DD/MM/YYYY HH:mm");
                return String(v);
            }

            const d = dayjs(v);
            if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
            return String(v);
        } catch {
            return String(v);
        }
    };

    return (
        <div className="w-full max-w-container-max-width mx-auto p-4 md:p-8 font-body-md text-on-surface antialiased">
            {/* Header Title */}
            <div className="mb-stack-lg pt-2">
                <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface mb-stack-sm font-bold">
                    Translate & Learn
                </h1>
                <p className="text-on-surface-variant font-body-lg text-body-lg">
                    Dịch chính xác tích hợp ngữ cảnh và phân tích lỗi ngữ pháp bằng AI.
                </p>
            </div>

            {/* Translation blocks list */}
            <div className="space-y-6">
                {renderedBlocks.map((b) => (
                    <div key={b.id} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-solid border-outline-variant/10 p-5">
                        <TranslateBlock
                            block={b}
                            removable={renderedBlocks.length > 1}
                            onChange={(patch) => updateBlock(b.id, patch)}
                            onTranslate={(file) => handleTranslate(b.id, file)}
                            onSwap={() => handleSwap(b.id)}
                            onDelete={() => deleteBlock(b.id)}
                            onCheckGrammar={() => handleCheckGrammar(b.id)}
                            isPremium={true}
                            fillKey={fillKeys[b.id]}
                            onClearSnapshot={() => {
                                previousTextRefPerBlock.current[b.id] = "";
                                previousEngineRefPerBlock.current[b.id] = "";
                                lastTranslateAtRefPerBlock.current[b.id] = 0;
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Add translation block trigger */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={() => addBlock()}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-transparent border border-solid border-primary hover:bg-primary/5 text-primary rounded-full font-label-md text-sm font-semibold transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm khung dịch mới
                </button>
            </div>

            {/* HISTORY SECTION */}
            <div className="mt-12 border-t border-solid border-outline-variant/10 pt-stack-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="flex items-center gap-2 font-headline-md text-lg md:text-xl text-on-surface font-bold m-0">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Lịch sử dịch thuật
                    </h2>
                    {token && (
                        <div className="flex items-center gap-2">
                            {!deleteMode ? (
                                <button
                                    onClick={() => {
                                        setDeleteMode(true);
                                        setSelectedIds([]);
                                    }}
                                    className="px-4 py-2 bg-error-container/20 hover:bg-error-container/30 text-error rounded-full font-label-md text-xs font-semibold border-none cursor-pointer transition-colors"
                                >
                                    Xóa lịch sử
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setDeleteMode(false);
                                            setSelectedIds([]);
                                        }}
                                        className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-xs font-semibold border-none cursor-pointer transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={onDeleteSelected}
                                        disabled={!selectedIds.length}
                                        className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold border-none cursor-pointer transition-colors ${
                                            !selectedIds.length
                                                ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                                                : "bg-error text-on-error hover:bg-error/80"
                                        }`}
                                    >
                                        Xóa đã chọn
                                    </button>
                                    <button
                                        onClick={onDeleteAll}
                                        className="px-4 py-2 bg-error text-on-error hover:bg-error/80 rounded-full font-label-md text-xs font-semibold border-none cursor-pointer transition-colors"
                                    >
                                        Xóa tất cả
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div
                    ref={historyRef}
                    className="bg-surface-container-lowest rounded-2xl border border-solid border-outline-variant/10 p-5 shadow-sm"
                >
                    {historyLoading && historyList.length === 0 ? (
                        <div className="py-10 text-center text-on-surface-variant italic">
                            Đang tải lịch sử dịch...
                        </div>
                    ) : historyList.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-8">
                            <img
                                className="w-12 h-12 opacity-55"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-center text-on-surface-variant text-sm">
                                Chưa có lịch sử dịch thuật nào.
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {historyList.map((h: any) => {
                                const sourceText =
                                    h.keyword ?? h.sourceText ?? h.text ?? "-";
                                const key =
                                    h.id ?? `${h.createdAt}-${Math.random()}`;

                                return (
                                    <div
                                        key={key}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (deleteMode) {
                                                if (h.id) toggleSelect(h.id);
                                                return;
                                            }
                                            const source = h;
                                            const sourceTextVal =
                                                source.keyword ??
                                                source.sourceText ??
                                                source.text ??
                                                "";
                                            const sourceLang =
                                                source.sourceLang ??
                                                source.langFrom ??
                                                "ja";
                                            const targetLang =
                                                source.targetLang ??
                                                source.langTo ??
                                                "vi";
                                            const id = makeId();
                                            setBlocks((prev) => [
                                                ...prev,
                                                {
                                                    id,
                                                    sourceText: sourceTextVal,
                                                    translatedText:
                                                        source.translatedText ??
                                                        source.result ??
                                                        "",
                                                    sourceLang,
                                                    targetLang,
                                                    engine:
                                                        source.engine ??
                                                        "GOOGLE",
                                                    loading: false,
                                                    file: undefined,
                                                    grammar: null,
                                                },
                                            ]);
                                            setFillKeys((prev) => ({
                                                ...prev,
                                                [id]: Date.now(),
                                            }));
                                            previousTextRefPerBlock.current[
                                                id
                                            ] = String(
                                                sourceTextVal ?? ""
                                            ).trim();
                                            previousEngineRefPerBlock.current[
                                                id
                                            ] = String(
                                                source.engine ?? "GOOGLE"
                                            );
                                            lastTranslateAtRefPerBlock.current[
                                                id
                                            ] = Date.now();
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                if (deleteMode) {
                                                    if (h.id)
                                                        toggleSelect(h.id);
                                                    return;
                                                }
                                                if (h.id) {
                                                    const source = h;
                                                    const sourceTextVal =
                                                        source.keyword ??
                                                        source.sourceText ??
                                                        source.text ??
                                                        "";
                                                    const sourceLang =
                                                        source.sourceLang ??
                                                        source.langFrom ??
                                                        "ja";
                                                    const targetLang =
                                                        source.targetLang ??
                                                        source.langTo ??
                                                        "vi";
                                                    const id = makeId();
                                                    setBlocks((prev) => [
                                                        ...prev,
                                                        {
                                                            id,
                                                            sourceText:
                                                                sourceTextVal,
                                                            translatedText:
                                                                source.translatedText ??
                                                                source.result ??
                                                                "",
                                                            sourceLang,
                                                            targetLang,
                                                            engine:
                                                                source.engine ??
                                                                "GOOGLE",
                                                            loading: false,
                                                            file: undefined,
                                                            grammar: null,
                                                        },
                                                    ]);
                                                    setFillKeys((prev) => ({
                                                        ...prev,
                                                        [id]: Date.now(),
                                                    }));
                                                    previousTextRefPerBlock.current[
                                                        id
                                                    ] = String(
                                                        sourceTextVal ?? ""
                                                    ).trim();
                                                    previousEngineRefPerBlock.current[
                                                        id
                                                    ] = String(
                                                        source.engine ??
                                                            "GOOGLE"
                                                    );
                                                    lastTranslateAtRefPerBlock.current[
                                                        id
                                                    ] = Date.now();
                                                }
                                            }
                                        }}
                                        className={`p-4 rounded-xl border border-solid transition-all cursor-pointer flex flex-col justify-between ${
                                            deleteMode
                                                ? "bg-surface-container-low border-outline-variant"
                                                : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary hover:shadow-sm"
                                        }`}
                                        aria-label={`Mở lịch sử: ${sourceText}`}
                                    >
                                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-solid border-outline-variant/10">
                                            <span className="text-[11px] font-bold text-[#FF7F50] bg-[#FF7F50]/10 px-2 py-0.5 rounded-full">
                                                {(() => {
                                                    if (!h.entityType)
                                                        return "Bản dịch";
                                                    const k = String(
                                                        h.entityType
                                                    ).toUpperCase();
                                                    if (
                                                        k === "WORD" ||
                                                        k === "VOCABULARY"
                                                    )
                                                        return "Từ vựng";
                                                    if (k === "KANJI")
                                                        return "Chữ Hán";
                                                    if (k === "GRAMMAR")
                                                        return "Ngữ pháp";
                                                    return String(h.entityType);
                                                })()}
                                            </span>
                                            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono">
                                                <span>{formatTime(h.createdAt ?? h.searchedAt ?? h.createdDate)}</span>
                                                {deleteMode && h.id && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(h.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelect(h.id);
                                                        }}
                                                        className="shrink-0"
                                                        aria-label="Chọn lịch sử"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-sm text-on-surface font-semibold line-clamp-2 leading-relaxed">
                                            {sourceText}
                                        </div>
                                    </div>
                                );
                            })}

                            {historyLoadingMore && (
                                <div className="col-span-1 md:col-span-2 py-4 text-center text-xs text-on-surface-variant italic animate-pulse">
                                    Đang tải thêm lịch sử dịch...
                                </div>
                            )}

                            {!historyHasMore && historyList.length > 0 && (
                                <div className="col-span-1 md:col-span-2 py-3 text-center text-xs text-on-surface-variant/60">
                                    Đã hiển thị tất cả lịch sử dịch thuật.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal yêu cầu đăng nhập */}
            <RequireLoginModal
                open={requireLoginFor !== null}
                onClose={() => setRequireLoginFor(null)}
                message={
                    requireLoginFor === "GRAMMAR" ? (
                        <>
                            Vui lòng đăng nhập để sử dụng chức năng Phân tích
                            ngữ pháp.
                        </>
                    ) : (
                        <>
                            Vui lòng đăng nhập để sử dụng chức năng Dịch với AI.
                        </>
                    )
                }
            />
        </div>
    );
}
