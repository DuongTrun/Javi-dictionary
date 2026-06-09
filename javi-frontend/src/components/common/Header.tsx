import { useEffect, useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { Button, Popover } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import avatarDefault from "@/assets/avatar.png";
import premium_avatar from "@/assets/premium-avatar.png";
import vietnam from "@/assets/vietnam.png";
import { PiNotePencilLight } from "react-icons/pi";
import { FiLogOut } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { callLogout } from "@/apis/authApi";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function AppHeader({ onMenuClick }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    const { token, user, clearAuth } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await callLogout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            clearAuth();
            navigate("/");
        }
    };

    let currentTitle = {
        "/": "Chào ngày mới",
        "/login": "Chào ngày mới",
        "/register": "Chào ngày mới",
        "/search/word": "Tra cứu",
        "/search/kanji": "Tra cứu",
        "/search/grammar": "Tra cứu",
        "/translate": "Dịch",
        "/jlpt": "JLPT",
        "/intro": "Giới thiệu",
        "/premium": "Nâng cấp",
        "/admin/users": "Quản lý người dùng",
        "/admin/word": "Quản lý từ vựng",
        "/admin/kanji": "Quản lý kanji",
        "/admin/grammar": "Quản lý ngữ pháp",
        "/admin/roles": "Quản lý vai trò",
        "/admin/permissions": "Quản lý quyền",
        "/users/my-info": "Trang cá nhân",
    }[location.pathname];

    if (!currentTitle && location.pathname.startsWith("/users/profile/")) {
        currentTitle = "Trang cá nhân";
    }

    if (!currentTitle) currentTitle = "Javi Dictionary";

    const displayName = user?.username || user?.fullName || "Người dùng";
    const displayId = user?.id ?? "?";
    const avatarSrc = user?.avatarUrl || avatarDefault;
    const isPremium = user?.accountType === "PREMIUM";

    const content = (
        <div className="text-base">
            <div className="flex gap-3 items-center justify-start">
                <div className="relative w-[44px] h-[44px] rounded-full overflow-visible">
                    <img
                        src={avatarSrc}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover"
                    />
                    {isPremium && (
                        <div
                            className="absolute left-1/2 top-[40%] w-[58px] h-[58px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none"
                            style={{
                                backgroundImage: `url(${premium_avatar})`,
                            }}
                        />
                    )}
                </div>

                <div>
                    <p className="font-normal mb-1">{displayName}</p>
                    <p className="text-sm text-[#7a809b]">ID: {displayId}</p>
                </div>
            </div>

            <div>
                <Link
                    to="/users/my-info"
                    className="flex items-center justify-center gap-1 my-2 bg-[#f1f5fd] p-[6px] rounded-2xl text-[#7a809b] text-base hover:text-black"
                >
                    <PiNotePencilLight className="text-[22px]" /> Chỉnh sửa hồ
                    sơ
                </Link>
            </div>

            <div className="text-[#ec2028] mt-3 pt-2 border-t border-gray-300 text-[16px] font-normal">
                <button
                    className="flex items-center justify-start gap-1 w-full h-full"
                    onClick={handleLogout}
                >
                    <FiLogOut /> Đăng xuất
                </button>
            </div>
        </div>
    );

    return (
        <header
            className={`fixed top-0 z-40
        w-full lg:w-[calc(100%-214px)] lg:left-[214px]
        h-[64px] flex items-center transition-all duration-300
        bg-surface/90 backdrop-blur-md border-b border-outline-variant/10 ${isScrolled ? "shadow-sm" : ""}`}
        >
            <div className="w-full max-w-[1380px] mx-auto flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <button
                        className="lg:hidden text-on-surface-variant hover:text-primary text-2xl transition-colors duration-200"
                        onClick={onMenuClick}
                    >
                        <RxHamburgerMenu />
                    </button>
                    <h1 className="hidden lg:block text-lg font-bold tracking-tight text-on-surface">
                        {currentTitle}
                    </h1>
                </div>

                <div className="flex items-center justify-end space-x-5">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                        <img
                            src={vietnam}
                            alt="VN"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {!token && (
                        <div className="flex gap-2.5">
                            {location.pathname !== "/login" && (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="!bg-gradient-to-r !from-[#3e66d4] !to-[#2c3f84] hover:scale-[1.02] active:scale-[0.98] !rounded-xl !border-none !h-[42px] !px-5 !text-[15px] !font-medium transition-all duration-300"
                                    onClick={() => navigate("/login")}
                                >
                                    Đăng nhập
                                </Button>
                            )}
                            {location.pathname !== "/register" && (
                                <Button
                                    size="large"
                                    className="!bg-white/90 hover:!bg-slate-50 hover:scale-[1.02] active:scale-[0.98] !text-slate-700 !border-slate-200 !rounded-xl !h-[42px] !px-5 !text-[15px] !font-medium transition-all duration-300"
                                    onClick={() => navigate("/register")}
                                >
                                    Đăng ký
                                </Button>
                            )}
                        </div>
                    )}

                    {token && (
                        <Popover
                            content={content}
                            trigger="click"
                            placement="bottom"
                            overlayInnerStyle={{
                                width: 240,
                                padding: "16px",
                                borderRadius: 16,
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                            }}
                        >
                            <button className="relative w-[42px] h-[42px] rounded-full overflow-visible transition-transform duration-300 hover:scale-105">
                                <img
                                    src={avatarSrc}
                                    alt="avatar"
                                    className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                                />
                                {isPremium && (
                                    <div
                                        className="absolute left-1/2 top-[40%] w-[56px] h-[56px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)] animate-pulse"
                                        style={{
                                            backgroundImage: `url(${premium_avatar})`,
                                        }}
                                    />
                                )}
                            </button>
                        </Popover>
                    )}
                </div>
            </div>
        </header>
    );
}
