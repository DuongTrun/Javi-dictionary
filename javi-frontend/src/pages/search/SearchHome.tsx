import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchSection from "@/components/search/SearchSection";

export default function SearchHome() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState<"word" | "kanji" | "grammar">(
        "word"
    );

    useEffect(() => {
        if (location.pathname.includes("/kanji")) setActiveTab("kanji");
        else if (location.pathname.includes("/grammar"))
            setActiveTab("grammar");
        else setActiveTab("word");
    }, [location.pathname]);

    const handleSearch = (kw: string) => {
        if (kw.trim())
            navigate(`/search/${activeTab}/${encodeURIComponent(kw.trim())}`);
    };

    return (
        <div className="w-full max-w-container-max-width mx-auto flex flex-col gap-6">
            <SearchSection onSubmit={handleSearch} activeTab={activeTab} />
            <div className="flex flex-col gap-6">
                <Outlet />
            </div>
        </div>
    );
}
