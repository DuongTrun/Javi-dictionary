import { useState } from "react";
import { Upload, message, Avatar, Tag } from "antd";
import type { UploadProps } from "antd";
import avatarDefault from "@/assets/avatar.png";
import premium_avatar from "@/assets/premium-avatar.png";
import { callUpdateAvatar } from "@/apis/userApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { IUserResponse } from "@/types/backend";

interface UserSidebarProps {
    user: any;
    activeTab: string;
    setActiveTab: (tab: "overview" | "activity" | "security") => void;
    isPublic?: boolean;
    isSelf?: boolean;
}

export default function UserSidebar({
    user,
    activeTab,
    setActiveTab,
    isPublic = false,
    isSelf = false,
}: UserSidebarProps) {
    const isPremium = user.accountType === "PREMIUM";

    const formatPremiumExpiry = (expiredAt: any): string => {
        if (!expiredAt) return "Trọn đời";
        if (typeof expiredAt === "string") {
            try {
                const d = new Date(expiredAt);
                if (!isNaN(d.getTime())) return d.toLocaleDateString("vi-VN");
            } catch {}
        }
        if (Array.isArray(expiredAt) && expiredAt.length >= 3) {
            try {
                const [year, month, day, hour = 0, minute = 0, second = 0] = expiredAt;
                const dt = new Date(year, month - 1, day, hour, minute, second);
                if (!isNaN(dt.getTime())) return dt.toLocaleDateString("vi-VN");
            } catch {}
        }
        return "Trọn đời";
    };
    const [avatarUrl, setAvatarUrl] = useState<string>(
        user.avatarUrl || avatarDefault
    );
    const { user: currentUser, setAuth } = useAuthStore();

    const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
        const isImage =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/jpg";
        if (!isImage) {
            message.error("Chỉ được chọn ảnh định dạng JPG, JPEG hoặc PNG!");
            return Upload.LIST_IGNORE;
        }

        // Giới hạn dung lượng 5MB
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error("Ảnh phải nhỏ hơn 5MB!");
            return Upload.LIST_IGNORE;
        }

        try {
            // preview tạm
            const reader = new FileReader();
            reader.onload = (e) =>
                setAvatarUrl((e.target?.result as string) || avatarDefault);
            reader.readAsDataURL(file);

            // upload thật
            const res = await callUpdateAvatar(file);
            if (res.data?.result) {
                message.success("Cập nhật ảnh đại diện thành công!");
                if (currentUser?.id === user.id) {
                    setAuth({
                        token: useAuthStore.getState().token!,
                        tokenType: "Bearer",
                        refresh_token: "",
                        user: {
                            ...(currentUser as IUserResponse),
                            avatarUrl: res.data.result,
                        },
                    });
                }
            }
        } catch {
            message.error("Không thể tải ảnh lên, vui lòng thử lại!");
        }
        return false;
    };

    const canUpload =
        !isPublic && isSelf && !!currentUser && currentUser.id === user.id;

    // Danh sách tab (ẩn "security" khi public)
    const tabs = [
        { key: "overview", label: "Giới thiệu chung" },
        { key: "activity", label: "Hoạt động" },
        ...(isSelf ? [{ key: "security", label: "Bảo mật" }] : []),
    ];

    return (
        <div className="w-full lg:w-[320px] bg-white rounded-2xl shadow p-5 flex flex-col items-center text-center gap-3">
            {/* Avatar (giữ nguyên layout & overlay) */}
            <div className="relative mb-3 mt-5 flex flex-col items-center">
                {canUpload ? (
                    <Upload
                        name="avatar"
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        accept=".jpg,.jpeg,.png"
                    >
                        <div className="relative group cursor-pointer">
                            <Avatar
                                size={100}
                                src={avatarUrl}
                                className="border border-gray-200 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-medium">
                                Đổi ảnh
                            </div>
                            {isPremium && (
                                <div
                                    className="absolute left-1/2 top-[36%] w-[150px] h-[150px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${premium_avatar})`,
                                    }}
                                />
                            )}
                        </div>
                    </Upload>
                ) : (
                    <div className="relative">
                        <Avatar
                            size={100}
                            src={avatarUrl}
                            className="border border-gray-200 shadow-sm"
                        />
                        {isPremium && (
                            <div
                                className="absolute left-1/2 top-[36%] w-[150px] h-[150px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none"
                                style={{
                                    backgroundImage: `url(${premium_avatar})`,
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Thông tin cơ bản (giữ nguyên) */}
            <h2 className="text-xl font-normal">
                {user.username || "Người dùng"}
            </h2>
            <p className="text-sm py-1 px-3 bg-[#ffeecc] text-[#ad6800] font-normal rounded-2xl">
                {isPremium
                    ? `Ngày hết hạn Premium: ${formatPremiumExpiry(user.premiumExpiredAt)}`
                    : "Tài khoản miễn phí"}
            </p>

            <Tag
                color={user.status === "ACTIVE" ? "green" : "red"}
                className="text-sm px-3 py-[2px] rounded-full"
            >
                {user.status === "ACTIVE" ? "Đang hoạt động" : "Đã bị khóa"}
            </Tag>

            {/* Tabs (giữ class cũ) */}
            <div className="flex flex-col w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() =>
                            setActiveTab(
                                tab.key as "overview" | "activity" | "security"
                            )
                        }
                        className={`py-2 px-4 rounded-xl text-left mb-1 transition ${
                            activeTab === tab.key
                                ? "bg-[#3e67d6] text-white"
                                : "hover:bg-gray-100"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
