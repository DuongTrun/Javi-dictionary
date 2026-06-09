import { Link, useLocation } from "react-router-dom";
import { hasAnyPermission } from "@/utils/permission";
import { useAuthStore } from "@/stores/useAuthStore";
import javi from "../../assets/javi-logo.png";

const links = [
    // Public menu
    {
        path: "/search/word",
        label: "Tra cứu",
        icon: "search",
    },
    { 
        path: "/translate", 
        label: "Dịch AI", 
        icon: "translate" 
    },
    {
        path: "/jlpt",
        label: "JLPT",
        icon: "menu_book",
    },
    {
        path: "/topics",
        label: "Chủ đề",
        icon: "category",
    },
    {
        path: "/study-decks",
        label: "Sổ tay",
        icon: "style",
    },
    {
        path: "/intro",
        label: "Giới thiệu",
        icon: "help_outline",
    },
    {
        path: "/premium",
        label: "Nâng cấp VIP",
        icon: "workspace_premium",
    },

    // Admin menu
    {
        path: "/admin/users",
        label: "QL Người dùng",
        icon: "manage_accounts",
        required: ["MANAGE_USER", "CREATE_USER"],
    },
    {
        path: "/admin/word",
        label: "QL Từ Vựng",
        icon: "edit_document",
        required: [
            "CREATE_VOCABULARY",
            "UPDATE_VOCABULARY",
            "DELETE_VOCABULARY",
        ],
    },
    {
        path: "/admin/kanji",
        label: "QL Kanji",
        icon: "layers",
        required: ["CREATE_KANJI", "UPDATE_KANJI", "DELETE_KANJI"],
    },
    {
        path: "/admin/grammar",
        label: "QL Ngữ Pháp",
        icon: "book",
        required: ["CREATE_GRAMMAR", "UPDATE_GRAMMAR", "DELETE_GRAMMAR"],
    },
    {
        path: "/admin/roles",
        label: "QL Vai Trò",
        icon: "admin_panel_settings",
        required: ["MANAGE_ROLE"],
    },
    {
        path: "/admin/permissions",
        label: "QL Quyền",
        icon: "vpn_key",
        required: ["MANAGE_PERMISSION"],
    },
    {
        path: "/admin/payment-orders",
        label: "QL Thanh toán",
        icon: "payments",
        required: ["MANAGE_USER"],
    },
];

interface SidebarProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);

    const visibleLinks = links.filter((link) => {
        if (!link.required) return true;
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
                            bg-surface border-r border-outline-variant/10 text-on-surface flex flex-col transform transition-transform duration-300
                            ${open ? "translate-x-0" : "-translate-x-full"}
                            lg:translate-x-0 lg:z-40 shadow-md`}
            >
                {/* Logo section */}
                <Link to="/" onClick={() => setOpen(false)}>
                    <div className="flex justify-center items-center my-6 transition-transform duration-300 hover:scale-102">
                        <img
                            src={javi}
                            alt="Javi logo"
                            className="w-[105px] h-[48px] object-cover"
                        />
                    </div>
                </Link>

                {/* Subheader Title */}
                <div className="mb-4 px-6">
                    <h2 className="font-semibold text-sm text-on-surface tracking-wide">JAVI Dictionary</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Master Japanese - Vietnamese</p>
                </div>

                {/* Menu Nav Links */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {visibleLinks.map(({ path, label, icon }) => {
                        const isSearch = path.startsWith("/search");
                        const active = isSearch
                            ? location.pathname.startsWith("/search")
                            : location.pathname === path;

                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? "bg-primary-container text-on-primary-container shadow-sm"
                                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                                }`}
                                onClick={() => setOpen(false)}
                            >
                                <span
                                    className={`material-symbols-outlined mr-3 text-lg flex-shrink-0 transition-colors duration-200 ${
                                        active ? "icon-fill text-on-primary-container" : "text-on-surface-variant"
                                    }`}
                                >
                                    {icon}
                                </span>
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
