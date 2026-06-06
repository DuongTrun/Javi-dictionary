import { useEffect, useState } from "react";
import { callGetRecentComments } from "@/apis/commentApi";
import { ICommentResponse, EntityType } from "@/types/backend";
import avatar from "@/assets/avatar.png";
import SearchResultModal from "@/components/search/SearchResultModal";
import { useNavigate } from "react-router-dom";
import { GoCommentDiscussion } from "react-icons/go";

export default function RecentComments() {
    const navigate = useNavigate();

    const [items, setItems] = useState<ICommentResponse[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // modal
    const [open, setOpen] = useState(false);
    const [entityType, setEntityType] = useState<EntityType>("WORD");
    const [entityId, setEntityId] = useState<number | string>(0);

    const load = async (pageToLoad = page, reset = false) => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await callGetRecentComments(pageToLoad, 10);
            const data = res.data?.result;
            const list = data?.content ?? [];
            // dùng functional update để tránh stale state khi setItems dựa trên items hiện tại
            setItems((prev) => (reset ? list : [...prev, ...list]));
            setHasMore(!(data?.last ?? true));
            setPage(pageToLoad + 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mở modal hiển thị entity (và lưu lịch sử)
    // Nếu là KANJI, dùng entityName (ký tự) để modal gọi API lấy chi tiết theo characterName
    const openEntity = (type: EntityType, idOrName: number | string) => {
        setEntityType(type);
        setEntityId(idOrName);
        setOpen(true);
    };

    const typeLabel = (t: EntityType) =>
        t === "WORD" ? "từ vựng" : t === "KANJI" ? "hán tự" : "ngữ pháp";

    const typeStyles = (t: EntityType) => {
        switch (t) {
            case "WORD":
                return "bg-blue-50 text-blue-600 border border-blue-100/60";
            case "KANJI":
                return "bg-purple-50 text-purple-600 border border-purple-100/60";
            case "GRAMMAR":
                return "bg-orange-50 text-orange-600 border border-orange-100/60";
            default:
                return "bg-slate-50 text-slate-600 border border-slate-100";
        }
    };

    return (
        <div className="glass-card rounded-2xl p-5 flex flex-col shadow-sm border border-slate-200/50">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-800 pb-3 mb-3 border-b border-slate-200/60">
                <GoCommentDiscussion className="text-[#3e66d4] text-[18px]" /> 
                Bình luận gần đây
            </h2>

            {/* Khung danh sách có cuộn */}
            <div className="flex-1 max-h-[200px] md:max-h-[480px] overflow-y-auto pr-1 text-[13px] text-slate-700 divide-y divide-slate-100 scroll-x-thin">
                {items.map((c) => (
                    <div key={c.id} className="py-3.5 first:pt-0">
                        {/* dòng nội dung 2 dòng + tag loại */}
                        <div className="flex items-start gap-2.5">
                            <span className={`text-center shrink-0 mt-[2px] rounded-lg text-[9px] font-bold px-1.5 py-[2px] w-[65px] uppercase tracking-wider ${typeStyles(c.entityType)}`}>
                                {typeLabel(c.entityType)}
                            </span>

                            {/* Hiển thị entityName */}
                            <p className="line-clamp-2 leading-relaxed text-slate-700">
                                {c.entityName && (
                                    <span className="text-[#3e66d4] font-semibold mr-1">
                                        {c.entityName}:
                                    </span>
                                )}
                                {c.content}
                            </p>
                        </div>

                        {/* user */}
                        <div className="flex items-center gap-2 text-slate-500 mt-2.5 pl-[75px]">
                            <img
                                src={c.avatarUrl || avatar}
                                alt="avatar"
                                className="w-5 h-5 rounded-full border border-slate-200 shadow-sm"
                            />
                            {/* click username -> profile */}
                            <span
                                onClick={() =>
                                    navigate(`/users/profile/${c.userName}`)
                                }
                                className="truncate cursor-pointer font-medium hover:underline hover:text-[#3e66d4] transition-colors"
                            >
                                {c.userName}
                            </span>

                            {/* click xem chi tiết -> mở modal và LƯU lịch sử */}
                            <button
                                onClick={() => {
                                    if (c.entityType === "KANJI") {
                                        const charName =
                                            c.entityName ?? String(c.entityId);
                                        openEntity(c.entityType, charName);
                                    } else {
                                        openEntity(
                                            c.entityType,
                                            Number(c.entityId)
                                        );
                                    }
                                }}
                                className="ml-auto text-[12px] text-[#3e66d4] font-semibold hover:underline hover:text-[#2c3f84]"
                            >
                                Chi tiết
                            </button>
                        </div>
                    </div>
                ))}

                {!items.length && !loading && (
                    <div className="py-6 text-center text-slate-400">
                        Chưa có bình luận.
                    </div>
                )}
            </div>

            {/* Nút xem thêm tách đáy */}
            {items.length > 0 && (
                <div className="pt-3 mt-1 border-t border-slate-200/60 text-center">
                    <button
                        onClick={() => hasMore && load(page)}
                        disabled={!hasMore || loading}
                        className="text-[13px] font-semibold text-[#3e66d4] hover:text-[#2c3f84] hover:underline disabled:text-slate-400 transition-colors"
                    >
                        {hasMore
                            ? loading
                                ? "Đang tải..."
                                : "Xem thêm bình luận"
                            : "Đã hiển thị tất cả"}
                    </button>
                </div>
            )}

            {/* Modal đa năng: LƯU lịch sử vì user chủ động click */}
            <SearchResultModal
                open={open}
                onClose={() => setOpen(false)}
                entityType={entityType}
                entityId={entityId}
            />
        </div>
    );
}
