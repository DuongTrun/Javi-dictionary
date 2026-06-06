interface CategoryTabsProps {
    activeTab: string;
    onTabChange: (tab: "word" | "kanji" | "grammar") => void;
}

export default function CategoryTabs({
    activeTab,
    onTabChange,
}: CategoryTabsProps) {
    const tabs = [
        { key: "word", label: "Từ vựng" },
        { key: "kanji", label: "Hán tự" },
        { key: "grammar", label: "Ngữ pháp" },
    ];

    return (
        <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() =>
                        onTabChange(tab.key as "word" | "kanji" | "grammar")
                    }
                    className={`px-5 py-2 text-[14px] font-semibold rounded-2xl transition-all duration-300 transform active:scale-95 ${
                        activeTab === tab.key
                            ? "bg-gradient-to-r from-[#3e66d4] to-[#2c3f84] text-white shadow-md shadow-blue-100"
                            : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
