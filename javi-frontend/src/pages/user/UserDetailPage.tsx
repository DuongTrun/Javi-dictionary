import { useState, useEffect } from "react";
import UserInfoPanel from "@/components/user/UserInfoPanel";
import UserSecurityPanel from "@/components/user/UserSecurityPanel";
import UserActivityPanel from "@/components/user/UserActivityPanel";
import {
    callGetMyInfo,
    callGetPublicUserProfile,
    callGetUserById,
    callUpdateAvatar,
} from "@/apis/userApi";
import { Spin, Upload, message, Avatar, Tag, Tooltip } from "antd";
import type { UploadProps } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoadingOutlined } from "@ant-design/icons";
import avatarDefault from "@/assets/avatar.png";
import premium_avatar from "@/assets/premium-avatar.png";
import dayjs from "dayjs";
import { IUserResponse } from "@/types/backend";

export default function UserDetailPage() {
    const { username } = useParams<{ username?: string }>();
    const location = useLocation();
    const state = (location.state || {}) as {
        adminView?: boolean;
        userId?: number;
    };
    const [activeTab, setActiveTab] = useState<
        "overview" | "activity" | "security"
    >("overview");
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { user: currentUser, setAuth } = useAuthStore();
    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setNotFound(false);

                if (state.adminView && state.userId) {
                    const res = await callGetUserById(state.userId);
                    const foundUser = res.data?.result;
                    if (!foundUser) {
                        setNotFound(true);
                        return;
                    }
                    setUser(foundUser);
                    if (activeTab === "security") setActiveTab("overview");
                } else if (username) {
                    const res = await callGetPublicUserProfile(username);
                    const foundUser = res.data?.result;
                    if (!foundUser) {
                        setNotFound(true);
                        return;
                    }
                    setUser(foundUser);
                    if (activeTab === "security") setActiveTab("overview");
                } else {
                    const res = await callGetMyInfo();
                    setUser(res.data?.result);
                }
            } catch (err: any) {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [username, state.adminView, state.userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <img
                    src="/notfound-user.png"
                    alt="Not found"
                    className="w-[180px] h-[180px] mb-5 opacity-80"
                    onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                    }
                />
                <h2 className="text-xl font-bold text-on-surface mb-2">
                    Không tìm thấy người dùng này
                </h2>
                <p className="text-on-surface-variant text-sm max-w-sm">
                    Tài khoản bạn đang tìm kiếm có thể đã bị xóa hoặc chưa tồn tại.
                </p>
            </div>
        );
    }

    if (!user) return null;

    const isPublic = Boolean(username);
    const isSelf =
        (isPublic && username === currentUser?.username) ||
        (!isPublic && currentUser?.id === user?.id);

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

    const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
        const isImage =
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/jpg";
        if (!isImage) {
            message.error("Chỉ được chọn ảnh định dạng JPG, JPEG hoặc PNG!");
            return Upload.LIST_IGNORE;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error("Ảnh phải nhỏ hơn 5MB!");
            return Upload.LIST_IGNORE;
        }

        try {
            const res = await callUpdateAvatar(file);
            if (res.data?.result) {
                message.success("Cập nhật ảnh đại diện thành công!");
                const newAvatarUrl = res.data.result;
                
                // Update local state
                setUser((prev: any) => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);

                // Update auth store if this is my profile
                if (currentUser?.id === user.id) {
                    setAuth({
                        token: useAuthStore.getState().token!,
                        tokenType: "Bearer",
                        refresh_token: "",
                        user: {
                            ...(currentUser as IUserResponse),
                            avatarUrl: newAvatarUrl,
                        },
                    });
                }
            }
        } catch {
            message.error("Không thể tải ảnh lên, vui lòng thử lại!");
        }
        return false;
    };

    const canUpload = !isPublic && isSelf && !!currentUser && currentUser.id === user.id;
    const realCanManageUser = currentUser?.role?.permissions?.some(
        (p: any) => p.name === "MANAGE_USER"
    );
    const realCanManageRole = currentUser?.role?.permissions?.some(
        (p: any) => p.name === "MANAGE_ROLE"
    );

    const showEditButton = !isPublic && (isSelf || realCanManageUser || realCanManageRole);

    const stripHtml = (htmlStr: string) => {
        if (!htmlStr) return "";
        return htmlStr.replace(/<[^>]*>/g, "").trim();
    };

    const bioText = stripHtml(user.selfIntroduction) 
        ? stripHtml(user.selfIntroduction) 
        : "Thành viên tích cực học tiếng Nhật cùng JAVI Dictionary.";

    // Deterministic metrics based on user.id or name for premium mockup visual metrics
    const baseNum = user.id ? Number(user.id) : 12;
    const dayStreak = (baseNum * 3) % 20 + 3;
    const wordsCount = (baseNum * 47) % 600 + 150;
    const cardsCount = (baseNum * 23) % 400 + 80;
    const avgAccuracy = (baseNum * 7) % 15 + 80; // 80% to 94%

    const tabs = [
        { key: "overview", label: "Tổng quan", icon: "dashboard" },
        { key: "activity", label: "Nhật ký hoạt động", icon: "history" },
        ...(isSelf ? [{ key: "security", label: "Bảo mật", icon: "security" }] : []),
    ];

    return (
        <div className="w-full px-4 md:px-8 py-6 max-w-[1200px] mx-auto space-y-6">
            {/* 1. Profile Header Bento Card */}
            <section className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 md:p-8 border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed opacity-40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                    {/* Avatar with upload and premium ring */}
                    <div className="relative">
                        {canUpload ? (
                            <Upload
                                name="avatar"
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                                accept=".jpg,.jpeg,.png"
                            >
                                <div className="relative group cursor-pointer w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface shadow-md">
                                    <Avatar
                                        size="large"
                                        src={user.avatarUrl || avatarDefault}
                                        className="w-full h-full border border-gray-100 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                                        Đổi ảnh
                                    </div>
                                    {isPremium && (
                                        <div
                                            className="absolute left-1/2 top-[36%] w-[170px] h-[170px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none"
                                            style={{
                                                backgroundImage: `url(${premium_avatar})`,
                                            }}
                                        />
                                    )}
                                </div>
                            </Upload>
                        ) : (
                            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface shadow-md">
                                <Avatar
                                    size="large"
                                    src={user.avatarUrl || avatarDefault}
                                    className="w-full h-full border border-gray-100 object-cover"
                                />
                                {isPremium && (
                                    <div
                                        className="absolute left-1/2 top-[36%] w-[170px] h-[170px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-no-repeat bg-center pointer-events-none"
                                        style={{
                                            backgroundImage: `url(${premium_avatar})`,
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        {/* Status Indicator */}
                        <div className={`absolute bottom-1 right-2 w-5 h-5 rounded-full border-2 border-surface ${user.status === "ACTIVE" ? "bg-tertiary" : "bg-error"}`} />
                    </div>

                    {/* User Profile Info text */}
                    <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start justify-center pt-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-2 font-headline-lg">
                            {user.fullName || user.username || "Người dùng"}
                        </h2>
                        <p className="text-sm md:text-base text-on-surface-variant font-medium max-w-lg mb-4">
                            {bioText.substring(0, 160)}
                            {bioText.length > 160 && "..."}
                        </p>
                        
                        {/* Badges bar */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                            {user.level && (
                                <div className="flex items-center gap-1 px-3.5 py-1 bg-secondary text-on-secondary rounded-full shadow-sm">
                                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                                    <span className="text-xs font-semibold tracking-wide">JLPT {user.level}</span>
                                </div>
                            )}
                            <div className={`flex items-center gap-1 px-3.5 py-1 rounded-full shadow-sm ${isPremium ? "bg-tertiary text-on-tertiary" : "bg-surface-container-high text-on-surface-variant"}`}>
                                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isPremium ? "'FILL' 1" : "'FILL' 0" }}>workspace_premium</span>
                                <span className="text-xs font-semibold tracking-wide">
                                    {isPremium
                                        ? `Premium (Hạn: ${formatPremiumExpiry(user.premiumExpiredAt)})`
                                        : "Tài khoản Miễn phí"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Profile button */}
                    {showEditButton && (
                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={() => setEditModalOpen(true)}
                                className="px-6 py-2.5 rounded-full border-[1.5px] border-primary text-primary font-semibold text-sm hover:bg-primary-fixed hover:border-transparent active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Chỉnh sửa hồ sơ
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* 2. Custom Tabs Pill Bar */}
            <div className="flex items-center justify-start gap-2 border-b border-outline-variant/10 pb-2 overflow-x-auto scroll-x-thin">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shrink-0 ${
                                isActive
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* 3. Tab contents */}
            <div>
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* 4-column Stats Bento Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Card 1: Streak */}
                            <div className="bg-surface-container-lowest shadow-sm rounded-2xl p-5 border border-outline-variant/10 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                </div>
                                <span className="text-2xl font-bold text-on-surface font-headline-md">{dayStreak}</span>
                                <span className="text-xs text-on-surface-variant font-medium mt-0.5">Ngày học liên tiếp</span>
                            </div>

                            {/* Card 2: Words learned */}
                            <div className="bg-surface-container-lowest shadow-sm rounded-2xl p-5 border border-outline-variant/10 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                                </div>
                                <span className="text-2xl font-bold text-on-surface font-headline-md">{wordsCount}</span>
                                <span className="text-xs text-on-surface-variant font-medium mt-0.5">Từ vựng đã học</span>
                            </div>

                            {/* Card 3: Flashcards mastered */}
                            <div className="bg-surface-container-lowest shadow-sm rounded-2xl p-5 border border-outline-variant/10 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-on-tertiary-container">
                                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                                </div>
                                <span className="text-2xl font-bold text-on-surface font-headline-md">{cardsCount}</span>
                                <span className="text-xs text-on-surface-variant font-medium mt-0.5">Thẻ học đã thuộc</span>
                            </div>

                            {/* Card 4: Accuracy */}
                            <div className="bg-surface-container-lowest shadow-sm rounded-2xl p-5 border border-outline-variant/10 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-on-surface text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <span className="text-2xl font-bold text-on-surface font-headline-md">{avgAccuracy}%</span>
                                <span className="text-xs text-on-surface-variant font-medium mt-0.5">Phát âm chuẩn</span>
                            </div>
                        </div>

                        {/* Bento details and side cards layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left part: Bio & Details (col-span-2) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Bio Card */}
                                <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                                    <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                                        Giới thiệu bản thân
                                    </h3>
                                    <div
                                        className="prose text-sm text-on-surface-variant break-words whitespace-normal leading-relaxed font-medium"
                                        dangerouslySetInnerHTML={{
                                            __html: user.selfIntroduction || "<p className='italic text-outline'>Chưa có lời giới thiệu nào. Hãy bấm 'Chỉnh sửa hồ sơ' để giới thiệu bản thân nhé!</p>",
                                        }}
                                    />
                                </div>

                                {/* Personal Information Details Card */}
                                <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                                    <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                                        Thông tin cá nhân
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-container-low">
                                            <span className="text-xs text-outline font-semibold uppercase">Họ và tên</span>
                                            <span className="text-sm font-semibold text-on-surface">{user.fullName || "—"}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-container-low">
                                            <span className="text-xs text-outline font-semibold uppercase">Tên đăng nhập</span>
                                            <span className="text-sm font-semibold text-on-surface">{user.username}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-container-low">
                                            <span className="text-xs text-outline font-semibold uppercase">Email</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-on-surface truncate">{user.email || "—"}</span>
                                                {user.email && (
                                                    <Tag color={user.verified ? "green" : "volcano"} className="rounded-md border-none font-semibold text-[10px] scale-95 uppercase">
                                                        {user.verified ? "Đã xác minh" : "Chưa xác minh"}
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-container-low">
                                            <span className="text-xs text-outline font-semibold uppercase">Ngày sinh</span>
                                            <span className="text-sm font-semibold text-on-surface">
                                                {user.dateOfBirth && dayjs(user.dateOfBirth).isValid()
                                                    ? dayjs(user.dateOfBirth).format("DD/MM/YYYY")
                                                    : "—"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-container-low">
                                            <span className="text-xs text-outline font-semibold uppercase">Trình độ</span>
                                            <span className="text-sm font-semibold text-on-surface">{user.level || "Chưa thiết lập"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Roles & Permissions (If admin/manager viewable) */}
                                {realCanManageUser && (
                                    <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                                        <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                                            Vai trò & Quyền hạn hệ thống
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-3.5 rounded-xl bg-primary-fixed/20 border border-primary/10">
                                                <p className="font-bold text-primary text-sm uppercase mb-1">
                                                    Vai trò: {user.role?.name}
                                                </p>
                                                <p className="text-xs text-on-surface-variant font-medium">
                                                    {user.role?.description || "Không có mô tả chi tiết."}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {user.role?.permissions?.map((perm: any) => (
                                                    <Tooltip
                                                        key={perm.id}
                                                        title={perm.description || "Không có mô tả chi tiết"}
                                                        placement="top"
                                                    >
                                                        <span className="px-3 py-1 bg-surface-container-high text-on-surface font-semibold text-xs rounded-full border border-outline-variant/30 cursor-help hover:bg-primary-fixed hover:text-primary transition-colors duration-200">
                                                            {perm.name}
                                                        </span>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right part: Goal & Recent comments activity list (col-span-1) */}
                            <div className="space-y-6">
                                {/* Weekly Goal Card */}
                                <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                                    <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">tour</span>
                                        Mục tiêu tuần
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-end mb-1 text-xs font-semibold">
                                                <span className="text-on-surface">Từ vựng mới</span>
                                                <span className="text-primary">80 / 100 từ</span>
                                            </div>
                                            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: "80%" }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-end mb-1 text-xs font-semibold">
                                                <span className="text-on-surface">Thời gian tự luyện</span>
                                                <span className="text-tertiary">5h / 7h</span>
                                            </div>
                                            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                                                <div className="h-full bg-tertiary rounded-full transition-all duration-300" style={{ width: "71%" }}></div>
                                            </div>
                                        </div>
                                        <div className="bg-primary-fixed/20 p-4 rounded-xl mt-4 flex items-start gap-2.5">
                                            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                                                Bạn đang thực hiện rất tốt lộ trình học của tuần này! Hãy tiếp tục duy trì nhé.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Card */}
                                <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                                    <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">comment</span>
                                        Hoạt động bình luận
                                    </h3>
                                    <UserActivityPanel
                                        layout="mini"
                                        username={username || user?.username || null}
                                        onViewAll={() => setActiveTab("activity")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="bg-surface-container-lowest shadow-sm rounded-[24px] p-6 border border-outline-variant/10">
                        <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[24px]">history</span>
                            Nhật ký hoạt động bình luận
                        </h3>
                        <UserActivityPanel
                            layout="full"
                            pageSize={20}
                            username={username || user?.username || null}
                        />
                    </div>
                )}

                {activeTab === "security" && isSelf && (
                    <div className="max-w-xl mx-auto">
                        <UserSecurityPanel />
                    </div>
                )}
            </div>

            {/* Helper modal-only component to control updates form */}
            <UserInfoPanel
                user={user}
                activeTab={activeTab}
                onUserUpdated={setUser}
                isPublic={isPublic}
                forceOpen={editModalOpen}
                onForceOpenHandled={() => setEditModalOpen(false)}
                modalOnly={true}
                canManageUser={realCanManageUser}
                canManageRole={realCanManageRole}
            />
        </div>
    );
}
