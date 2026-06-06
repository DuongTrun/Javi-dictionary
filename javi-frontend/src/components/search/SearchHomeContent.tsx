import { FaLightbulb } from "react-icons/fa";
import banner from "../../assets/banner.png";
import { MdHistory } from "react-icons/md";
import no_history from "../../assets/no-history.png";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { callGetHistory } from "@/apis/historyApi";
import HistoryModal from "@/components/history/HistoryModal";
import SearchResultModal from "@/components/search/SearchResultModal";
import HistoryPickerModal from "@/components/history/HistoryPickerModal";
import { EntityType } from "@/types/backend";
import { useNavigate } from "react-router-dom";
import RequireLoginModal from "../common/RequireLoginModal";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

/**
 * Search home content — trang chính khi vào /search
 * thêm modal lịch sử (HistoryModal) và picker modal khi click keyword không có entityId.
 */

export default function SearchHomeContent() {
    const user = useAuthStore((s) => s.user);
    const isLoggedIn = !!user;
    const isPremium = user?.accountType === "PREMIUM";

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // modal lịch sử (danh sách)
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // picker modal (Mazii-like) khi click history item mà không có entityId
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerKeyword, setPickerKeyword] = useState<string>("");
    const [pickerDefaultTab, setPickerDefaultTab] = useState<
        "KANJI" | "WORD" | "GRAMMAR" | null
    >(null);

    // modal detail universal (mở khi click chip hoặc picker chọn item có id)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] =
        useState<EntityType>("WORD");
    const [detailEntityId, setDetailEntityId] = useState<number | string>(0);

    const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);

    const navigate = useNavigate();

    /** Gọi API lấy lịch sử khi đã đăng nhập */
    const fetchHistory = () => {
        if (!isLoggedIn) return;

        setLoading(true);
        callGetHistory(1)
            .then((res) => {
                setHistory(res.data?.result?.content || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const openHistoryModal = () => setHistoryModalOpen(true);
    const closeHistoryModal = () => setHistoryModalOpen(false);

    /**
     * Khi click 1 chip trong preview lịch sử:
     * - Nếu item.entityId tồn tại => mở detail modal (truyền id hoặc character string)
     * - Nếu không có entityId => mở picker modal (HistoryPickerModal) với keyword + defaultTab = null
     *   -> picker sẽ gọi 3 API (kanji, vocab, grammar) đồng thời để show mọi khả năng
     */
    const openDetailFromChip = (h: any) => {
        const type = String(h?.entityType ?? "").toUpperCase();

        // Nếu có entityId => open detail directly (id may be number or string)
        if (
            h?.entityId !== undefined &&
            h?.entityId !== null &&
            String(h.entityId) !== ""
        ) {
            let idOrName: number | string = h.entityId;
            if (type === "KANJI" && h.entityName) {
                idOrName = h.entityName;
            }
            setDetailEntityType(h.entityType);
            setDetailEntityId(idOrName);
            setDetailOpen(true);
            return;
        }

        // Không có entityId -> OPEN PICKER và **gọi 3 API cùng lúc**
        // Để picker gọi 3 API cùng lúc, ta truyền defaultTab = null
        const kw = h.entityName ?? h.keyword ?? "";
        if (!kw) return;

        setPickerKeyword(kw);
        setPickerDefaultTab(null);
        setPickerOpen(true);
    };

    /**
     * Handler khi picker modal trả về 1 selection
     * payload: { entityType, id?, name? }
     * - Nếu id tồn tại -> mở detail modal (SearchResultModal)
     * - Nếu id không tồn tại -> điều hướng tới trang search?keyword=...&type=...
     */
    const handlePickerSelect = (payload: {
        entityType: "KANJI" | "WORD" | "GRAMMAR";
        id?: number | string;
        name?: string;
    }) => {
        if (
            payload.id !== undefined &&
            payload.id !== null &&
            String(payload.id).trim() !== ""
        ) {
            // open detail modal
            setDetailEntityType(payload.entityType as EntityType);
            setDetailEntityId(payload.id as number | string);
            setDetailOpen(true);
            return;
        }

        // fallback: navigate to search page with keyword (payload.name)
        const kw = payload.name ?? "";
        if (!kw) return;

        setHistoryModalOpen(false);

        const params = new URLSearchParams();
        params.set("keyword", kw);
        params.set("type", payload.entityType ?? "WORD");
        navigate(`/search?${params.toString()}`);
    };

    // Define JLPT gradient colors
    const jlptColors: Record<string, string> = {
        N1: "from-rose-500 to-red-600 shadow-rose-100 hover:from-rose-600 hover:to-red-700",
        N2: "from-amber-500 to-orange-600 shadow-amber-100 hover:from-amber-600 hover:to-orange-700",
        N3: "from-emerald-500 to-teal-600 shadow-emerald-100 hover:from-emerald-600 hover:to-teal-700",
        N4: "from-blue-500 to-indigo-600 shadow-blue-100 hover:from-blue-600 hover:to-indigo-700",
        N5: "from-slate-500 to-zinc-600 shadow-slate-100 hover:from-slate-600 hover:to-zinc-700",
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Banner: Ẩn nếu user là PREMIUM */}
            {!isPremium && (
                <div
                    className="w-full h-[240px] rounded-2xl border border-slate-200/60 bg-cover bg-center shadow-sm hover:scale-[1.005] transition-transform duration-500"
                    style={{ backgroundImage: `url(${banner})` }}
                ></div>
            )}

            {/* Content mặc định */}
            <div className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/50 flex flex-col gap-6">
                {/* Tips */}
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4.5 text-[14px] text-slate-700">
                    <h2 className="flex gap-2 items-center text-[16px] font-bold text-amber-800 mb-2.5">
                        <FaLightbulb className="text-amber-500 text-[18px]" />
                        Mẹo tra cứu thông minh
                    </h2>
                    <ul className="space-y-1.5">
                        {!isLoggedIn && (
                            <li className="leading-relaxed">
                                • <strong>Đăng nhập tài khoản Javi:</strong> Để đồng bộ lịch sử và sử dụng các tính năng AI xịn mịn.
                            </li>
                        )}
                        <li className="leading-relaxed">
                            • <strong>Tra nhanh:</strong> Bôi đen bất kỳ từ nào trên trang để hiển thị bảng tra cứu nhanh.
                        </li>
                        <li className="leading-relaxed">
                            • <strong>Tự động chuyển Kana:</strong> Nhập Romaji viết thường ra <strong>Hiragana</strong> (ví dụ: <em>nihongo</em>), viết hoa ra <strong>Katakana</strong> (ví dụ: <em>BETONAMU</em>).
                        </li>
                    </ul>
                </div>

                {/* Lịch sử */}
                <div className="flex flex-col">
                    <div className="flex flex-row items-center justify-between mb-3">
                        <h2 className="flex gap-2 items-center text-[18px] font-bold text-slate-800">
                            <MdHistory className="text-[#3e66d4] text-[20px]" />
                            Lịch sử tra cứu gần đây
                        </h2>
                        <button
                            className="text-[13px] font-semibold text-[#3e66d4] hover:text-[#2c3f84] hover:underline transition-colors"
                            onClick={() => {
                                if (!isLoggedIn) {
                                    setLoginRequiredOpen(true);
                                    return;
                                }
                                openHistoryModal();
                            }}
                        >
                            Xem tất cả
                        </button>
                    </div>

                    {/* loading thì hiện vòng tròn Spin */}
                    {loading && (
                        <div className="flex justify-center py-6">
                            <Spin
                                indicator={<LoadingOutlined spin />}
                                size="large"
                            />
                        </div>
                    )}

                    {/* Chưa đăng nhập */}
                    {!loading && !isLoggedIn && (
                        <div className="flex flex-col justify-center items-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <img
                                className="w-[48px] h-[48px] opacity-70"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-slate-400 text-sm">
                                Đăng nhập để lưu lịch sử tra cứu của bạn
                            </div>
                        </div>
                    )}

                    {/* Đã đăng nhập nhưng chưa có lịch sử */}
                    {!loading && isLoggedIn && history.length === 0 && (
                        <div className="flex flex-col justify-center items-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <img
                                className="w-[48px] h-[48px] opacity-70"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-slate-400 text-sm">
                                Bạn chưa tra cứu từ nào gần đây
                            </div>
                        </div>
                    )}

                    {/* Đã đăng nhập và có lịch sử */}
                    {!loading && isLoggedIn && history.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 p-3 border border-slate-100 rounded-2xl bg-slate-50/40">
                            {history.slice(0, 10).map((h, idx) => (
                                <button
                                    key={idx}
                                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/60 hover:border-[#3e66d4] hover:bg-blue-50/30 text-slate-700 hover:text-[#3e66d4] text-[14px] font-medium transition-all duration-300 transform active:scale-95 shadow-sm"
                                    onClick={() => openDetailFromChip(h)}
                                >
                                    {h.entityName ?? h.keyword}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* JLPT */}
                <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold text-slate-800 mb-3.5">
                        Luyện thi JLPT
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {["N1", "N2", "N3", "N4", "N5"].map((lvl) => (
                            <button
                                key={lvl}
                                className={`px-6 py-2.5 rounded-xl text-white font-bold bg-gradient-to-r ${jlptColors[lvl]} shadow-md hover:scale-[1.04] active:scale-95 transition-all duration-300 text-[14px]`}
                                onClick={() =>
                                    navigate(`/jlpt?level=${lvl}&type=vocab`)
                                }
                            >
                                Cấp độ {lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Nâng cấp Premium: chỉ hiện khi chưa premium */}
            {!isPremium && (
                <section className="premium-gradient text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                    <div className="relative z-10 flex flex-col">
                        <h3 className="text-xl font-bold tracking-tight mb-1.5 flex items-center gap-2">
                            👑 Trải nghiệm Javi Premium
                        </h3>
                        <p className="text-sm text-white/90">
                            Dịch ảnh OCR, học Spaced Repetition và luyện nói Kaiwa AI hoàn toàn không giới hạn!
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/premium")}
                        className="relative z-10 premium-gold-btn text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Nâng cấp ngay
                    </button>
                </section>
            )}

            {/* History modal (full list / infinite scroll / delete / select) */}
            <HistoryModal
                open={historyModalOpen}
                onClose={closeHistoryModal}
                onHistoryChanged={() => {
                    // Khi modal báo có thay đổi (xóa), fetch lại để cập nhật danh sách hiển thị ở trang chính
                    fetchHistory();
                }}
            />

            {/* Picker modal (nếu click vào history item mà không có entityId) */}
            <HistoryPickerModal
                open={pickerOpen}
                keyword={pickerKeyword}
                defaultTab={pickerDefaultTab}
                onClose={() => setPickerOpen(false)}
                onSelect={handlePickerSelect}
                pageSize={8}
            />

            {/* SearchResultModal cho click chip (hoặc khi picker chọn item có id) */}
            <SearchResultModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                entityType={detailEntityType}
                entityId={detailEntityId}
            />

            {/* Modal yêu cầu đăng nhập để xem lịch sử */}
            <RequireLoginModal
                open={loginRequiredOpen}
                onClose={() => setLoginRequiredOpen(false)}
                message="Bạn cần đăng nhập để xem toàn bộ lịch sử tra cứu."
            />
        </div>
    );
}
