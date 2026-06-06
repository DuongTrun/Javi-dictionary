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
                            glass-sidebar text-slate-200 flex flex-col transform transition-transform duration-300
                            ${open ? "translate-x-0" : "-translate-x-full"}
                            lg:translate-x-0 lg:z-40 shadow-2xl`}
            >
                <Link to="/">
                    <div className="flex justify-center items-center my-5 transition-transform duration-300 hover:scale-105">
                        <img
                            src={javi}
                            alt="Javi logo"
                            className="w-[105px] h-[48px] object-cover drop-shadow-[0_0_8px_rgba(62,102,212,0.3)]"
                        />
                    </div>
                </Link>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto px-2 py-2">
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
                                            className={`flex items-center px-4 py-2.5 my-1 text-[15px] font-medium rounded-xl transition-all duration-300 transform ${
                                                active
                                                    ? "bg-gradient-to-r from-[#3e66d4] to-[#2c3f84] text-white shadow-lg glow-active scale-[1.02]"
                                                    : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                                            }`}
                                            onClick={() => setOpen(false)}
                                        >
                                            {icon && (
                                                <span
                                                    className={`text-[20px] mr-3 flex-shrink-0 transition-colors duration-300 ${
                                                        active
                                                            ? "text-white"
                                                            : "text-slate-400 group-hover:text-white"
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
