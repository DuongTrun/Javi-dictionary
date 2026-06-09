import { useEffect, useRef, useState } from "react";
import { Spin, Empty } from "antd";
import dayjs from "dayjs";
import {
    callGetMyComments,
    callGetCommentsByUsername,
} from "@/apis/commentApi";
import { ICommentResponse } from "@/types/backend";
import SearchResultModal from "@/components/search/SearchResultModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
    pageSize?: number;
    username?: string | null;
    layout?: "mini" | "full";
    onViewAll?: () => void;
}

export default function UserActivityPanel({
    pageSize = 20,
    username = null,
    layout = "full",
    onViewAll,
}: Props) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [items, setItems] = useState<ICommentResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const { user: currentUser } = useAuthStore();
    // Trạng thái mở modal chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] = useState<any>("WORD");
    const [detailEntityIdOrName, setDetailEntityIdOrName] = useState<
        number | string
    >(0);

    const actualPageSize = layout === "mini" ? 3 : pageSize;

    const fetchPage = async (pageIndex = 0, reset = false) => {
        if (loading || loadingMore) return;
        try {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            let res: any;
            if (username && username !== currentUser?.username) {
                res = await callGetCommentsByUsername(
                    username,
                    pageIndex + 1,
                    actualPageSize
                );
            } else {
                res = await callGetMyComments(pageIndex + 1, actualPageSize);
            }

            const data = res.data?.result;
            const list = data?.content ?? [];

            setItems((prev) => (reset ? list : [...prev, ...list]));

            const lastFlag = Boolean(data?.last ?? true);
            setHasMore(!lastFlag);

            const returnedNumber =
                typeof data?.number !== "undefined" ? data.number : pageIndex;
            setPage(returnedNumber);

            if (layout === "full") {
                setTimeout(() => {
                    const el2 = scrollRef.current;
                    if (!el2) return;
                    const contentFits = el2.scrollHeight <= el2.clientHeight;

                    if (contentFits && !loadingMore && !lastFlag) {
                        fetchPage(returnedNumber + 1, false);
                    }
                }, 120);
            }
        } catch (err) {
            if (reset) setItems([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPage(0, true);
    }, [username]);

    // Infinite scroll: chỉ kích hoạt ở layout full
    useEffect(() => {
        if (layout === "mini") return;
        const el = scrollRef.current;
        if (!el) return;

        let ticking = false;
        const threshold = 260;

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const remaining =
                    el.scrollHeight - el.scrollTop - el.clientHeight;

                if (hasMore && !loadingMore && remaining < threshold) {
                    fetchPage(page + 1, false);
                }

                ticking = false;
            });
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, page, layout]);

    const formatDateOnly = (v?: string | null) => {
        if (!v) return "";
        const d = dayjs(v);
        if (d.isValid()) return d.format("DD/MM/YYYY");
        return String(v);
    };

    const onClickComment = (c: ICommentResponse) => {
        if (!c) return;
        const key = String(c.entityType ?? "").toUpperCase();

        if (key === "KANJI") {
            if (c.entityName) {
                setDetailEntityType(c.entityType);
                setDetailEntityIdOrName(c.entityName);
                setDetailOpen(true);
                return;
            }
            if (c.entityId !== undefined && c.entityId !== null) {
                setDetailEntityType(c.entityType);
                setDetailEntityIdOrName(c.entityId);
                setDetailOpen(true);
                return;
            }
            return;
        }

        if (c.entityId !== undefined && c.entityId !== null) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityId);
            setDetailOpen(true);
            return;
        }

        if (c.entityName) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityName);
            setDetailOpen(true);
        }
    };

    const mapEntityTypeLabel = (type?: string) => {
        switch ((type || "").toUpperCase()) {
            case "WORD":
                return "từ vựng";
            case "KANJI":
                return "chữ Kanji";
            case "GRAMMAR":
                return "ngữ pháp";
            default:
                return type || "";
        }
    };

    const getIconInfo = (type?: string) => {
        switch ((type || "").toUpperCase()) {
            case "WORD":
                return {
                    icon: "quiz",
                    bgClass: "bg-primary-fixed/30 text-primary",
                };
            case "KANJI":
                return {
                    icon: "bookmark",
                    bgClass: "bg-secondary-fixed/50 text-secondary",
                };
            case "GRAMMAR":
                return {
                    icon: "translate",
                    bgClass: "bg-surface-container-highest text-on-surface-variant",
                };
            default:
                return {
                    icon: "chat_bubble",
                    bgClass: "bg-surface-container-low text-on-surface-variant",
                };
        }
    };

    if (layout === "mini") {
        return (
            <>
                <div className="w-full flex flex-col justify-between h-full">
                    {loading && items.length === 0 ? (
                        <div className="py-8 flex justify-center">
                            <Spin indicator={<LoadingOutlined spin />} size="default" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-4 text-center">
                            <Empty description="Chưa có hoạt động gần đây" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <ul className="flex flex-col gap-3">
                                {items.map((c, idx) => {
                                    const commentDate =
                                        c.createdAt ?? (c as any).createdDate ?? null;
                                    const entityName = (c as any).entityName ?? "";
                                    const iconInfo = getIconInfo(c.entityType);
                                    
                                    return (
                                        <div key={c.id || idx}>
                                            <li
                                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                                                onClick={() => onClickComment(c)}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconInfo.bgClass}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{iconInfo.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-body-md text-sm font-semibold text-on-surface truncate">
                                                        Đã bình luận tại {mapEntityTypeLabel(c.entityType)} {entityName ? `"${entityName}"` : ""}
                                                    </h4>
                                                    <p className="text-xs text-on-surface-variant font-medium mt-0.5 line-clamp-1">
                                                        {c.content}
                                                    </p>
                                                    <p className="font-label-md text-[10px] text-outline mt-1">
                                                        {formatDateOnly(commentDate)}
                                                    </p>
                                                </div>
                                                <div className="font-label-md text-[11px] text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded-full shrink-0">
                                                    +50 XP
                                                </div>
                                            </li>
                                            {idx < items.length - 1 && (
                                                <div className="h-[1px] w-[calc(100%-48px)] bg-outline-variant/20 ml-14 my-1"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </ul>
                            {onViewAll && (
                                <button
                                    onClick={onViewAll}
                                    className="w-full mt-2 py-2.5 font-label-md text-sm text-primary hover:bg-primary-fixed/40 rounded-xl transition-all duration-200 border border-primary/20 hover:border-transparent font-semibold flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    Xem tất cả hoạt động
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <SearchResultModal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    entityType={detailEntityType}
                    entityId={detailEntityIdOrName}
                />
            </>
        );
    }

    return (
        <>
            <div
                ref={scrollRef}
                className="max-h-[520px] overflow-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm"
            >
                {loading && items.length === 0 ? (
                    <div className="py-8 flex justify-center">
                        <Spin
                            indicator={<LoadingOutlined spin />}
                            size="large"
                        />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-6">
                        <Empty description="Chưa có hoạt động" />
                    </div>
                ) : (
                    <div className="divide-y divide-outline-variant/20">
                        {items.map((c) => {
                            const commentDate =
                                c.createdAt ?? (c as any).createdDate ?? null;
                            const entityName = (c as any).entityName ?? "";
                            const iconInfo = getIconInfo(c.entityType);

                            return (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-4 p-4 hover:bg-surface-container-low cursor-pointer transition-colors"
                                    onClick={() => onClickComment(c)}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconInfo.bgClass}`}>
                                        <span className="material-symbols-outlined text-[20px]">{iconInfo.icon}</span>
                                    </div>
                                    <div className="w-full min-w-0">
                                        <div className="flex items-center justify-between text-xs w-full">
                                            <div className="text-outline font-medium flex items-center gap-1">
                                                <span className="capitalize font-semibold text-primary">
                                                    {mapEntityTypeLabel(c.entityType)}
                                                </span>
                                                {entityName && (
                                                    <span className="font-semibold text-on-surface-variant">
                                                        : {entityName}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-outline ml-4 text-nowrap">
                                                {formatDateOnly(commentDate)}
                                            </div>
                                        </div>

                                        <div className="text-sm text-on-surface-variant font-medium mt-1.5 whitespace-pre-line break-words">
                                            {c.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {loadingMore && (
                            <div className="py-4 text-center">
                                <Spin
                                    indicator={<LoadingOutlined spin />}
                                    size="large"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SearchResultModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                entityType={detailEntityType}
                entityId={detailEntityIdOrName}
            />
        </>
    );
}
