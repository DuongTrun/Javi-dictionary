import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import * as wanakana from "wanakana";

interface SearchBarProps {
    onSubmit?: (keyword: string) => void;
    activeTab?: "word" | "kanji" | "grammar";
}

export default function SearchBar({
    onSubmit,
    activeTab = "word",
}: SearchBarProps) {
    const { keyword: paramKeyword } = useParams<{ keyword?: string }>();
    const [keyword, setKeyword] = useState(paramKeyword || "");
    const location = useLocation();
    const navigate = useNavigate();

    // Đồng bộ input khi URL thay đổi
    useEffect(() => {
        if (paramKeyword !== undefined) setKeyword(paramKeyword);
    }, [paramKeyword]);

    const placeholderMap = {
        word: "日本, nihon, Nhật Bản",
        kanji: "公, CÔNG",
        grammar: "Cấu trúc ngữ pháp",
    };

    // Chuyển Romaji → Kana
    // Chuyển Romaji → Kana (cải tiến để tránh convert nhầm từ tiếng Việt / Hán-Việt)
    // Chỉ sửa logic: không thay đổi layout/className/DOM
    const convertInput = (value: string): string => {
        const trimmed = value.trim();
        if (!trimmed) return "";

        // Nếu chuỗi chứa ký tự Unicode ngoài ASCII (ví dụ có dấu tiếng Việt),
        // coi như người dùng đang nhập tiếng Việt → không convert.
        if (/[^\x00-\x7F]/.test(trimmed)) {
            return trimmed;
        }

        const low = trimmed.toLowerCase();

        // Danh sách từ tiếng Việt / Hán-Việt phổ biến tạm thời không convert.
        // Mở rộng được tuỳ chỉnh sau khi thu thập thêm case thực tế.
        const vietnameseBlacklist = new Set([
            "sinh",
            "hoc",
            "nhat",
            "viet",
            "ngay",
            "tam",
            "linh",
            "hoa",
            "an",
            // thêm từ khác nếu cần
        ]);

        if (vietnameseBlacklist.has(low)) {
            return trimmed;
        }

        // Pattern romaji đầy đủ:
        // - Các phụ âm kép/âm bật: ch, sh, ts, ky, gy, ny, hy, by, py, my, ry, ...
        // - Các tổ hợp 'y' như kya/kyu/kyo, gya/gyu/gyo, ...
        // - Tất cả cặp phụ âm + nguyên âm cơ bản: ka/ki/ku/ke/ko, sa/shi/su/se/so, ta/chi/tsu/te/to, ba/bi/...
        // - Nguyên âm dài / đôi: aa ii uu ee oo ou
        // - Double consonant (geminate) như 'kk', 'tt'... được coi là hợp lệ (ra tsu nhỏ)
        // - Kết thúc bằng âm mũi 'n'
        const romajiStrongPattern = new RegExp(
            [
                // cụm 'y' (kya, gya, sha, cha, nya, hya, bya, pya, mya, rya, ...)
                "(kya|kyu|kyo)",
                "(gya|gyu|gyo)",
                "(sha|shu|sho)",
                "(cha|chu|cho)",
                "(ja|ju|jo|ji)",
                "(nya|nyu|nyo)",
                "(hya|hyu|hyo)",
                "(bya|byu|byo)",
                "(pya|pyu|pyo)",
                "(mya|myu|myo)",
                "(rya|ryu|ryo)",
                // các âm đặc biệt
                "tsu",
                "shi",
                "chi",
                "fu",
                "ji",
                // nguyên âm dài / đôi (oo, ou, aa...)
                "(aa|ii|uu|ee|oo|ou)",
                // tất cả cặp phụ âm + nguyên âm cơ bản: k,g,s,z,t,d,n,h,b,p,m,y,r,w,v,f,c,l + nguyên âm
                // (bao gồm cả 'shi','chi' đã liệt kê ở trên)
                "(?:ch|sh|ts|[kgstzdbhpnmfrvwycl])(?:a|i|u|e|o)",
                // âm mũi 'n' kết thúc
                "n\\b",
                // geminate double consonant (ví dụ 'kk', 'tt'...) xuất hiện trước nguyên âm hoặc 'y'
                "(?:kk|tt|pp|ss|mm|nn|rr|gg|bb|dd)(?:[aeiouy])",
            ].join("|"),
            "i"
        );

        // Yêu cầu ít nhất 2 ký tự và khớp pattern romaji mạnh,
        // hoặc nếu người dùng gõ TOÀN CHỮ HOA (ý muốn katakana)
        const isLikelyRomaji =
            (low.length >= 2 && romajiStrongPattern.test(low)) ||
            /^[A-Z\s]+$/.test(trimmed);

        if (!isLikelyRomaji) {
            // Nếu không đủ tin cậy là romaji thì không convert.
            return trimmed;
        }

        // Nếu là romaji tin cậy:
        if (wanakana.isRomaji(trimmed)) {
            // Chuẩn hoá một số ký tự trước khi convert
            const normalized = trimmed
                .replace(/ー/g, "-")
                .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212−–—]/g, "-"); // các gạch khác -> minus

            // Nếu toàn chữ HOA + space + '-' thì coi là muốn Katakana
            if (/^[A-Z\s-]+$/.test(normalized)) {
                // Chuyển sang katakana (wanakana hoạt động tốt với lowercase romaji)
                return wanakana.toKatakana(normalized.toLowerCase());
            }

            // Mặc định -> Hiragana (giữ hành vi cũ)
            return wanakana.toHiragana(trimmed);
        }

        return trimmed;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const converted = convertInput(keyword);
        setKeyword(converted);

        if (!converted.trim()) return;

        // gọi onSubmit nếu có (để logic ngoài vẫn hoạt động)
        if (onSubmit) onSubmit(converted.trim());

        // ép Router cập nhật URL kể cả khi giống path cũ
        const newPath = `/search/${activeTab}/${encodeURIComponent(
            converted.trim()
        )}`;
        if (location.pathname === newPath) {
            // nếu trùng path → thêm timestamp param để ép reload
            navigate(`${newPath}?t=${Date.now()}`, { replace: true });
        } else {
            navigate(newPath);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <div className="flex flex-nowrap items-center w-full gap-3 h-[52px] md:h-[58px]">
                {/* Select ngôn ngữ */}
                <select className="md:hidden flex-shrink-0 bg-gradient-to-r from-[#3e66d4] to-[#2c3f84] text-white text-[14px] font-semibold px-3.5 h-full rounded-2xl outline-none hover:shadow-md cursor-pointer transition-all duration-300 appearance-none border-none">
                    <option className="text-slate-800">JA - VI</option>
                    <option className="text-slate-800">VI - JA</option>
                </select>

                <select className="hidden lg:block flex-shrink-0 bg-gradient-to-r from-[#3e66d4] to-[#2c3f84] text-white text-[15px] font-semibold px-5 h-full rounded-2xl outline-none hover:shadow-md cursor-pointer transition-all duration-300 appearance-none border-none">
                    <option className="text-slate-800">Nhật - Việt</option>
                    <option className="text-slate-800">Việt - Nhật</option>
                </select>

                {/* Ô tìm kiếm */}
                <div className="relative flex-1 h-full group">
                    {/* Icon tìm kiếm */}
                    <button
                        type="submit"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3e66d4] p-1.5 transition-colors duration-300"
                        title="Tìm kiếm"
                    >
                        <IoSearchOutline className="text-2xl" />
                    </button>

                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={placeholderMap[activeTab]}
                        className="w-full h-full border-2 border-slate-200/90 rounded-2xl pl-12 pr-4 md:pr-[120px] text-[15px] md:text-[16px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#3e66d4] focus:ring-4 focus:ring-blue-50/70 transition-all duration-300"
                    />

                    {/* Nút tìm kiếm bên phải */}
                    <button
                        type="submit"
                        className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#3e66d4] to-[#2c3f84] hover:scale-[1.02] active:scale-[0.98] text-white rounded-xl px-6 py-2.5 text-[15px] font-medium shadow-md transition-all duration-300"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </form>
    );
}
