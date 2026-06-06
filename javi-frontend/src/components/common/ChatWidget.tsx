import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { FiX } from "react-icons/fi";
import zaloImg from "@/assets/zalo.png";
import facebookImg from "@/assets/facebook.png";
import { BsChatDotsFill } from "react-icons/bs";

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Khi vào trang /premium thì widget tự mở
        // Giữ thêm /upgrade để tương thích với link cũ nếu cần
        const path = location.pathname || "";
        if (path.includes("/premium") || path.includes("/upgrade")) {
            setOpen(true);
        } else {
            // Nếu muốn giữ widget mở khi rời khỏi trang premium, đổi dòng này thành: // no-op
            setOpen(false);
        }
    }, [location.pathname]);
    const items = [
        {
            key: "zalo",
            img: zaloImg,
            href: "https://zalo.me/0978945022",
            delayClass: "delay-200",
        },
        {
            key: "facebook",
            img: facebookImg,
            href: "https://www.facebook.com/trung.nguyenduong.5070",
            delayClass: "delay-75",
        },
    ];

    return (
        <div
            className="fixed right-4 bottom-4 z-[60] flex flex-col items-end"
            aria-hidden={false}
        >
            {/* Menu (3 icons) */}
            <div className="flex flex-col items-end">
                {items.map((it) => {
                    // Khi open = true -> visible state
                    // className chuyển: translate-y and opacity and scale
                    const visibleClasses =
                        "translate-y-0 opacity-100 scale-100 pointer-events-auto";
                    const hiddenClasses =
                        "translate-y-6 opacity-0 scale-90 pointer-events-none";

                    return (
                        <a
                            key={it.key}
                            href={it.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            // thêm delay để tạo stagger effect, và transition cho transform/opacity/scale
                            className={
                                // đặt margin giữa các nút
                                "mb-3 inline-flex items-center justify-center rounded-full bg-white shadow-lg w-14 h-14 overflow-hidden " +
                                // transition + thời lượng + easing
                                "transition-all duration-300 " +
                                // thêm delay từ cấu hình item
                                it.delayClass +
                                " " +
                                // trạng thái hiển thị
                                (open ? visibleClasses : hiddenClasses)
                            }
                            onClick={() => {
                                // khi nhấn mở link: đóng widget (mở tab mới) để UX giống app
                                setOpen(false);
                            }}
                            aria-label={
                                it.key === "zalo"
                                    ? "Chat Zalo"
                                    : "Chat Messenger"
                            }
                            title={it.key === "zalo" ? "Zalo" : "Messenger"}
                        >
                            <img
                                src={it.img}
                                alt={it.key}
                                className="w-8 h-8"
                            />
                        </a>
                    );
                })}
            </div>

            {/* Nút chính */}
            <div className="mt-1">
                {open ? (
                    <button
                        onClick={() => setOpen(false)}
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-white text-gray-700 focus:outline-none transition-transform duration-200 hover:scale-105"
                        aria-label="Đóng chat"
                        title="Đóng"
                    >
                        <FiX className="text-2xl" />
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white focus:outline-none transition-transform duration-200 hover:scale-105"
                        aria-label="Mở chat"
                        title="Chat với chúng tôi"
                    >
                        <BsChatDotsFill className="text-2xl" />
                    </button>
                )}
            </div>
        </div>
    );
}
