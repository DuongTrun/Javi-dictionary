import { useNavigate, useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";

interface SearchSectionProps {
    onSubmit?: (keyword: string) => void;
    activeTab?: "word" | "kanji" | "grammar";
}

export default function SearchSection({
    onSubmit,
    activeTab,
}: SearchSectionProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Xác định tab hiện tại (ưu tiên prop activeTab, fallback theo URL)
    const currentTab: "word" | "kanji" | "grammar" =
        activeTab ??
        (location.pathname.includes("/kanji")
            ? "kanji"
            : location.pathname.includes("/grammar")
            ? "grammar"
            : "word");

    /** Xử lý khi người dùng đổi tab */
    const handleTabChange = (tab: "word" | "kanji" | "grammar") => {
        const path = location.pathname;
        const parts = path.split("/");
        const keyword = parts[parts.length - 1];
        const hasKeyword =
            path.includes("/word/") ||
            path.includes("/kanji/") ||
            path.includes("/grammar/");

        // Nếu đang ở trang chi tiết (có keyword), chuyển cùng keyword sang tab khác
        if (hasKeyword && keyword) {
            navigate(`/search/${tab}/${decodeURIComponent(keyword)}`);
        } else {
            navigate(`/search/${tab}`);
        }
    };

    return (
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <SearchBar onSubmit={onSubmit} activeTab={currentTab} />
            <CategoryTabs
                activeTab={currentTab}
                onTabChange={handleTabChange}
            />
        </div>
    );
}
