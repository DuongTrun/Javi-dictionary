import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import AppHeader from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import { useGlobalErrorStore } from "@/stores/useGlobalErrorStore";
import ServerError from "@/components/common/ServerError";
import ChatWidget from "@/components/common/ChatWidget";
import SelectionSearchButton from "@/components/common/SelectionSearchButton";
import HistoryPickerModal from "@/components/history/HistoryPickerModal";
import SearchResultModal from "@/components/search/SearchResultModal";
import type { EntityType } from "@/types/backend";
import IntroModal from "@/components/common/IntroModal";
import PremiumUpgradeModal from "@/components/common/PremiumUpgradeModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { callGetMyInfo } from "@/apis/userApi";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // state cho modal picker khi user bôi đen & nhấn kính lúp
    // state cho feature bôi đen -> mở picker
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerKeyword, setPickerKeyword] = useState<string | undefined>(
        undefined
    );
    const [introOpen, setIntroOpen] = useState(false);
    // state để mở modal chi tiết (SearchResultModal)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] =
        useState<EntityType>("WORD"); // default
    const [detailEntityId, setDetailEntityId] = useState<
        number | string | null
    >(null);

    const navigate = useNavigate();

    const { serverDown, setServerDown } = useGlobalErrorStore();
    const token = useAuthStore((s) => s.token);
    const setUser = useAuthStore((s) => s.setUser);

    useEffect(() => {
        if (token) {
            callGetMyInfo()
                .then((res) => {
                    const u = res.data?.result;
                    if (u) {
                        setUser(u);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch current user info:", err);
                });
        }
    }, [token, setUser]);

    useEffect(() => {
        if (!localStorage.getItem("javi_seen_intro_v1")) setIntroOpen(true);
    }, []);

    // Bao giờ server lỗi hoặc không chạy sẽ render ra
    if (serverDown) {
        return <ServerError onRetry={() => setServerDown(false)} />;
    }

    // Hàm được gọi khi user bôi đen text rồi nhấn icon kính lúp
    const handleSelectionFromPage = (text: string) => {
        setPickerKeyword(text);
        setPickerOpen(true);
    };

    return (
        <div className="bg-[#f7f8fa] font-sans min-h-screen m-0 object-cover overflow-y-overlay overflow-x-hidden">
            {/* Sidebar cố định */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            {/* Nội dung chính */}
            <div className="flex flex-col min-h-screen lg:ml-[214px] transition-all duration-300">
                {/* Header */}
                <AppHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden mt-[64px]">
                    <div className="max-w-[1380px] mx-auto px-0">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <div className="px-2 lg:px-4 mt-4">
                    <Footer />
                </div>
            </div>
            {/* Chat widget toàn cục (luôn fixed trên màn hình) */}
            <ChatWidget />
            <SelectionSearchButton
                onSelect={(text) => handleSelectionFromPage(text)}
                enabled={!pickerOpen} // ẩn nút khi picker đang mở
            />

            <HistoryPickerModal
                open={pickerOpen}
                keyword={pickerKeyword ?? ""}
                defaultTab={null} // hoặc "KANJI" / "WORD" / "GRAMMAR" nếu muốn mặc định 1 tab
                onClose={() => {
                    // đóng modal picker, clear keyword
                    setPickerOpen(false);
                    setPickerKeyword(undefined);
                }}
                onSelect={(payload: {
                    entityType: "KANJI" | "WORD" | "GRAMMAR";
                    id?: number | string;
                    name?: string;
                }) => {
                    // Nếu payload có id => mở detail modal
                    if (
                        payload.id !== undefined &&
                        payload.id !== null &&
                        String(payload.id).trim() !== ""
                    ) {
                        // Gán state để SearchResultModal fetch chi tiết
                        setDetailEntityType(payload.entityType as EntityType);
                        setDetailEntityId(payload.id as number | string);
                        // Bật modal chi tiết
                        setDetailOpen(true);
                        return;
                    }

                    // Nếu không có id — điều hướng tới trang search với keyword + type
                    const q = payload.name ?? "";
                    if (!q) return;

                    setPickerOpen(false);
                    const params = new URLSearchParams();
                    params.set("keyword", q);
                    params.set("type", payload.entityType ?? "WORD");
                    navigate(`/search?${params.toString()}`);
                }}
            />
            {/* Modal chi tiết: khi payload.id được trả về từ HistoryPickerModal thì sẽ mở */}
            <SearchResultModal
                open={detailOpen}
                onClose={() => {
                    setDetailOpen(false);
                    setDetailEntityId(null);
                }}
                entityType={detailEntityType}
                entityId={detailEntityId ?? ""}
            />

            <IntroModal open={introOpen} onClose={() => setIntroOpen(false)} />
            <PremiumUpgradeModal />
        </div>
    );
}
