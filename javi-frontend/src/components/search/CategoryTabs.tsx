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
                    className={`px-5 py-2 text-[14px] font-semibold rounded-full transition-all duration-300 transform active:scale-95 border-none cursor-pointer ${
                        activeTab === tab.key
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
