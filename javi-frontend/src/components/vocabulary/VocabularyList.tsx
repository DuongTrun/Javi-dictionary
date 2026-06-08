import { Button } from "antd";
import { toRomaji } from "wanakana";

import {
    IKanjiDetailResponse,
    IVocabResponse,
    IMeaning,
} from "@/types/backend";

import { RotateCcw } from "lucide-react";

import { useEffect, useRef, useState } from "react";

interface Props {
    vocabularies: IVocabResponse[];
    selectedId: string | null;
    onSelect: (word: string) => void;
    keyword?: string;
    kanjiDetails: IKanjiDetailResponse[];
    onViewKanjiDetail: (character: string) => void;
}

export default function VocabularyList({
    vocabularies,
    selectedId,
    onSelect,
    keyword,
    kanjiDetails,
    onViewKanjiDetail,
}: Props) {
    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Reset trang khi thay đổi danh sách từ (khi tìm kiếm từ mới)
    useEffect(() => {
        setCurrentPage(1);
    }, [vocabularies]);

    // helper: chuyển HTML -> text thuần (loại bỏ thẻ)
    // dùng để tránh in thẻ ReactQuill ra giao diện
    const extractTextFromHtml = (html?: string | null) => {
        if (!html) return "";
        // tạo element tạm và lấy textContent
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent?.trim() ?? "";
    };

    // khi kanjiDetails thay đổi -> thử autoplay các video (muted)
    useEffect(() => {
        kanjiDetails.forEach((k, idx) => {
            const v = videoRefs.current[idx];
            if (v && k.videoUrl) {
                v.muted = true;
                v.loop = true;
                v.playsInline = true;
                // try play, ignore rejection (browser có thể block)
                v.play().catch(() => {});
            }
        });
    }, [kanjiDetails]);

    const totalPages = Math.ceil(vocabularies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVocabularies = vocabularies.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex flex-col">
            <h3 className="text-gray-800 mb-3 text-[15px]">
                Kết quả tra cứu từ vựng:{" "}
                <span className="text-[#3e67d6]">{keyword}</span>
            </h3>

            {/* ==== DANH SÁCH TỪ VỰNG ==== */}
            <div className="flex flex-col">
                {vocabularies.length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-4">
                        Không có kết quả nào phù hợp.
                    </p>
                ) : (
                    paginatedVocabularies.map((item) => {
                        // loại bỏ thẻ HTML (ReactQuill output)
                        // nối các nghĩa bằng "; "
                        // loại bỏ giá trị rỗng và duplicate
                        const rawMeanings =
                            Array.isArray(item.meanings) &&
                            item.meanings.length > 0
                                ? (item.meanings as IMeaning[])
                                : [];

                        const meaningTexts = rawMeanings
                            .map((m) => extractTextFromHtml(m.meaningVn))
                            .map((t) => t.trim())
                            .filter(Boolean);

                        // loại bỏ duplicate (giữ thứ tự)
                        const deduped: string[] = [];
                        meaningTexts.forEach((t) => {
                            if (!deduped.includes(t)) deduped.push(t);
                        });

                        const meaningText = deduped.join("; ");

                        return (
                            <div
                                key={item.word}
                                onClick={() => {
                                    onSelect(item.word);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedId === item.word
                                        ? "bg-[#f1f5fd]"
                                        : "bg-white"
                                }`}
                            >
                                <div>
                                    {/* Hán tự */}
                                    <h1 className="text-lg font-medium text-[#3e67d6] leading-tight">
                                        {item.word}
                                    </h1>

                                    {/* Hiragana */}
                                    {item.hiragana && (
                                        <p className="text-[14px] text-gray-600 leading-tight mt-1">
                                            {item.hiragana} ({toRomaji(item.hiragana)})
                                        </p>
                                    )}

                                    {/* Nghĩa (đã strip HTML, nối bằng ';', clamp 2 dòng) */}
                                    <p
                                        className="text-[14px] text-gray-700 meaning-clamp-2-line mt-1"
                                        title={meaningText || "Không có nghĩa"}
                                    >
                                        {meaningText || "Không có nghĩa"}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ==== PHÂN TRANG CHO TỪ VỰNG ==== */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 px-2 pt-2 border-t border-gray-100 mb-3">
                    <Button
                        size="small"
                        disabled={currentPage === 1}
                        onClick={() => {
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Trang trước
                    </Button>
                    <span className="text-[13px] text-gray-500 font-medium">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                        size="small"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        Trang sau
                    </Button>
                </div>
            )}

            {/* ==== DANH SÁCH KANJI CỦA TỪ ==== */}
            {kanjiDetails && kanjiDetails.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-gray-700 mb-3 font-normal text-[15px]">
                        Các chữ Kanji của{" "}
                        <span className="text-[#3e67d6]">{selectedId}</span>
                    </h4>
                    <div className="flex flex-col">
                        {kanjiDetails.map((k, idx) => (
                            <div
                                key={idx}
                                className="border-b border-gray-200 p-3 last:border-b-0 last:rounded-b-2xl last:pb-0"
                            >
                                <div className="flex items-start gap-3">
                                    {/* GIF hoặc Video minh họa */}
                                    <div className="w-[80px] h-[80px] relative flex items-center justify-center flex-shrink-0">
                                        {k.gifUrl ? (
                                            <img
                                                src={k.gifUrl}
                                                alt={k.characterName}
                                                className="w-[80px] h-[80px] object-contain"
                                            />
                                        ) : (
                                            <>
                                                <video
                                                    ref={(el) => {
                                                        videoRefs.current[idx] =
                                                            el;
                                                    }}
                                                    src={k.videoUrl}
                                                    className="w-[80px] h-[80px] object-contain rounded shadow-sm"
                                                    muted
                                                    playsInline
                                                    loop
                                                    // preload để giảm độ trễ
                                                    preload="auto"
                                                />
                                                {/* Nút phát lại góc trên phải */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const video =
                                                            videoRefs.current[
                                                                idx
                                                            ];
                                                        if (video) {
                                                            try {
                                                                video.pause();
                                                                video.currentTime = 0;
                                                                video
                                                                    .play()
                                                                    .catch(
                                                                        () => {
                                                                            // ignore nếu browser block play
                                                                        }
                                                                    );
                                                            } catch (err) {
                                                                // ignore timing errors
                                                            }
                                                        }
                                                    }}
                                                    title="Phát lại video"
                                                    className="absolute top-1 right-1 bg-white/80 hover:bg-white text-blue-600 p-[2px] rounded-full shadow-sm transition"
                                                >
                                                    <RotateCcw size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thông tin Kanji */}
                                    <div className="flex-1">
                                        <p className="text-[18px] font-medium text-[#3e67d6] mb-1">
                                            {k.characterName}{" "}
                                            <span className="text-base font-normal text-gray-800">
                                                「{k.sinoViName}」
                                            </span>
                                        </p>

                                        {/* --- Kun readings --- */}
                                        <div className="flex items-start text-sm text-gray-700 gap-2">
                                            <span className="text-gray-800 pt-[2px] flex-shrink-0">
                                                訓 :
                                            </span>

                                            <div className="">
                                                {k.kunyomi &&
                                                k.kunyomi.length > 0 ? (
                                                    k.kunyomi.map((r, i) => (
                                                        <span key={i}>
                                                            {r}
                                                            {i <
                                                                k.kunyomi
                                                                    .length -
                                                                    1 && "・"}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* --- On readings --- */}
                                        <div className="flex items-start text-sm text-gray-700 gap-2 mt-1">
                                            <span className="text-gray-800 pt-[2px] flex-shrink-0">
                                                音 :
                                            </span>

                                            <div className="">
                                                {k.onyomi &&
                                                k.onyomi.length > 0 ? (
                                                    k.onyomi.map((r, i) => (
                                                        <span key={i}>
                                                            {r}
                                                            {i <
                                                                k.onyomi
                                                                    .length -
                                                                    1 && "・"}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            size="small"
                                            type="link"
                                            className="!p-0 text-blue-600 hover:underline"
                                            onClick={() =>
                                                onViewKanjiDetail(
                                                    k.characterName
                                                )
                                            }
                                        >
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
