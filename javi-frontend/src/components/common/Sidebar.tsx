import { Link, useLocation } from "react-router-dom";
import {
    PiTranslateLight,
    PiCube,
    PiCrownSimpleLight,
    PiCrownSimpleFill,
    PiBookBookmarkFill,
    PiBookBookmark,
    PiNotebook,
    PiNotebookFill,
    PiBookOpen,
    PiBookOpenFill,
} from "react-icons/pi";
import { BsCursor, BsCursorFill } from "react-icons/bs";
import javi from "../../assets/javi-logo.png";
import {
    IoCube,
    IoEarth,
    IoEarthOutline,
    IoLayers,
    IoLayersOutline,
    IoReader,
    IoReaderOutline,
} from "react-icons/io5";
import { hasAnyPermission } from "@/utils/permission";
import { useAuthStore } from "@/stores/useAuthStore";

import {
    MdAdminPanelSettings,
    MdLockPerson,
    MdManageAccounts,
    MdOutlineAdminPanelSettings,
    MdOutlineLockPerson,
    MdOutlineManageAccounts,
    MdOutlinePayment,
    MdPayment,
} from "react-icons/md";

const links = [
    // Public menu
    {
        path: "/search/word",
        label: "Tra cứu",
        icon: <IoEarthOutline />,
        selectIcon: <IoEarth />,
    },
    { path: "/translate", label: "Dịch", icon: <PiTranslateLight /> },
    {
        path: "/jlpt",
        label: "JLPT",
        icon: <PiBookBookmark />,
        selectIcon: <PiBookBookmarkFill />,
    },
    {
        path: "/topics",
        label: "Chủ đề",
        icon: <PiBookOpen />,
        selectIcon: <PiBookOpenFill />,
    },
    {
        path: "/study-decks",
        label: "Sổ tay",
        icon: <PiNotebook />,
        selectIcon: <PiNotebookFill />,
    },
    {
        path: "/intro",
        label: "Giới thiệu",
        icon: <PiCube />,
        selectIcon: <IoCube />,
    },
    {
        path: "/premium",
        label: "Nâng cấp",
        icon: <PiCrownSimpleLight />,
        selectIcon: <PiCrownSimpleFill />,
    },

    // Admin menu — thêm required permission
    {
        path: "/admin/users",
        label: "QL Người dùng",
        icon: <MdOutlineManageAccounts />,
        selectIcon: <MdManageAccounts />,
        required: ["MANAGE_USER", "CREATE_USER"],
    },
    {
        path: "/admin/word",
        label: "QL Từ Vựng",
        icon: <BsCursor />,
        selectIcon: <BsCursorFill />,
        required: [
            "CREATE_VOCABULARY",
            "UPDATE_VOCABULARY",
            "DELETE_VOCABULARY",
        ],
    },
    {
        path: "/admin/kanji",
        label: "QL Kanji",
        icon: <IoLayersOutline />,
        selectIcon: <IoLayers />,
        required: ["CREATE_KANJI", "UPDATE_KANJI", "DELETE_KANJI"],
    },
    {
        path: "/admin/grammar",
        label: "QL Ngữ Pháp",
        icon: <IoReaderOutline />,
        selectIcon: <IoReader />,
        required: ["CREATE_GRAMMAR", "UPDATE_GRAMMAR", "DELETE_GRAMMAR"],
    },
    {
        path: "/admin/roles",
        label: "QL Vai Trò",
        icon: <MdOutlineAdminPanelSettings />,
        selectIcon: <MdAdminPanelSettings />,
        required: ["MANAGE_ROLE"],
    },
    {
        path: "/admin/permissions",
        label: "QL Quyền",
        icon: <MdOutlineLockPerson />,
        selectIcon: <MdLockPerson />,
        required: ["MANAGE_PERMISSION"],
    },
    {
        path: "/admin/payment-orders",
        label: "QL Thanh toán",
        icon: <MdOutlinePayment />,
        selectIcon: <MdPayment />,
        required: ["MANAGE_USER"],
    },
];

// Thêm interface cho props
interface SidebarProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);

    const visibleLinks = links.filter((link) => {
        if (!link.required) return true; // link public
        return hasAnyPermission(user, link.required);
    });

    return (
        <>
            {/* Overlay cho mobile */}
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 lg:hidden ${
                    open ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar cố định */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-[214px]
                            bg-gradient-to-b from-[#3e66d4] to-[#2c3f84]
                            text-white flex flex-col transform transition-transform duration-300
                            ${open ? "translate-x-0" : "-translate-x-full"}
                            lg:translate-x-0 lg:z-40`}
            >
                <Link to="/">
                    <div className="flex justify-center items-center my-3">
                        <img
                            src={javi}
                            alt="Javi logo"
                            className="w-[100px] h-[46px] object-cover"
                        />
                    </div>
                </Link>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto">
                    <ul className="space-y-1">
                        {visibleLinks.map(
                            ({ path, label, icon, selectIcon }) => {
                                // Nếu là "Tra cứu" (path bắt đầu /search) thì active cho tất cả /search/*
                                const isSearch = path.startsWith("/search");
                                const active = isSearch
                                    ? location.pathname.startsWith("/search")
                                    : location.pathname === path;

                                return (
                                    <li key={path}>
                                        <Link
                                            to={path}
                                            className={`flex items-center px-[18px] py-[8px] my-[4px] mx-2 text-[16px] transition-all duration-500 ${
                                                active
                                                    ? "bg-[#d0e0f9] text-[#262a34] rounded-2xl"
                                                    : "text-white/90 hover:text-white"
                                            }`}
                                            onClick={() => setOpen(false)}
                                        >
                                            {icon && (
                                                <span
                                                    className={`text-[24px] mr-[12px] flex-shrink-0 ${
                                                        active
                                                            ? "text-[#3e66d4]"
                                                            : "text-white"
                                                    }`}
                                                >
                                                    {active && selectIcon
                                                        ? selectIcon
                                                        : icon}
                                                </span>
                                            )}
                                            {label}
                                        </Link>
                                    </li>
                                );
                            }
                        )}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
