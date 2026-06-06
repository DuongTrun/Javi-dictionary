import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, message, Modal, Result } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";
import { callCreatePaymentOrder } from "@/apis/paymentOrderApi";
import { PremiumType } from "@/types/backend";

import zalo from "@/assets/zalo.png";
import tiktok from "@/assets/tiktok.png";
import facebook from "@/assets/facebook.png";
import youtube from "@/assets/youtube.png";
import instagram from "@/assets/instagram.png";
import messenger from "@/assets/messenger.png";

import { IoCopy } from "react-icons/io5";
import { FaCheckCircle, FaClock } from "react-icons/fa";

type Plan = {
    id: string;
    months: number;
    price: string;
    originalPrice?: string;
    highlight?: boolean;
    bgUrl?: string;
    type?: string;
};

export default function BankPaymentConfirmPage(): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s: any) => s.user);

    const [confirmLoading, setConfirmLoading] = useState(false);
    const [orderSubmitted, setOrderSubmitted] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const state: any = location.state ?? {};
    const plan: Plan | undefined = state.plan;

    if (!plan) {
        navigate("/premium");
        return <div />;
    }

    const parsePrice = (p?: string) => {
        if (!p) return 0;
        const digits = p.replace(/\./g, "").replace(/[^\d]/g, "");
        return parseInt(digits || "0", 10);
    };

    const formatPrice = (v: number) =>
        v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const basePriceNum = parsePrice(plan.price);
    const javiDiscount = Math.round((basePriceNum * 0.05) / 1000) * 1000;
    const totalAfter = basePriceNum - javiDiscount;

    const bankInfo = {
        bankName: "Ngân hàng MB",
        accountHolder: "NGUYEN DUONG TRUNG",
        accountNumber: "6833013082003",
        branch: "MB Bank - Chi nhánh Chí Linh",
    };

    const transferContent = `${user?.email ?? ""} - Javi Premium ${
        plan.months
    } Tháng`;

    const qrUrl = `https://img.vietqr.io/image/MB-6833013082003-compact.png?amount=${totalAfter}&addInfo=${encodeURIComponent(
        transferContent
    )}&accountName=${encodeURIComponent("NGUYEN DUONG TRUNG")}`;

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success("Đã sao chép");
        } catch {
            message.error("Sao chép thất bại");
        }
    };

    const onDownloadQR = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `javi-bank-qr-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Lỗi tải QR:", error);
            window.open(qrUrl, "_blank");
        }
    };

    // Map plan type string to PremiumType enum
    const getPremiumType = (): PremiumType => {
        switch (plan.months) {
            case 1: return "MONTHLY_1";
            case 3: return "MONTHLY_3";
            case 6: return "MONTHLY_6";
            default: return "LIFETIME";
        }
    };

    const handleConfirmPayment = () => {
        if (!user) {
            message.warning("Vui lòng đăng nhập để xác nhận thanh toán");
            navigate("/login");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const socialLinks = {
        // facebook: "https://www.facebook.com/duyhieu.nguyen.98434",
        // tiktok: "https://www.tiktok.com/@pantheon.ndh",
        // zalo: "https://zalo.me/0978945022",
        // instagram: "https://www.instagram.com/dhieu.ndh/",
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#3e66d4] via-[#4f78e4] to-[#2c3f84] text-white p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-blue-900 to-black pointer-events-none"></div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight relative z-10">
                        Đăng ký Javi Premium
                    </h1>
                    <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-md mx-auto relative z-10">
                        Hoàn thành chuyển khoản qua ngân hàng để kích hoạt các tính năng Premium
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
                    {/* Left Column: Bank Details & Instructions (7 cols) */}
                    <div className="md:col-span-7 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 rounded-full bg-[#3e66d4]" />
                                Thông tin chuyển khoản
                            </h3>

                            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                    <span className="text-gray-500 text-sm font-medium">Ngân hàng</span>
                                    <span className="text-gray-800 font-bold text-sm">{bankInfo.bankName}</span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                    <span className="text-gray-500 text-sm font-medium">Chủ tài khoản</span>
                                    <span className="text-gray-800 font-bold text-sm">{bankInfo.accountHolder}</span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                    <span className="text-gray-500 text-sm font-medium">Số tài khoản</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[#3e66d4] font-bold text-base tracking-wider">
                                            {bankInfo.accountNumber}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(bankInfo.accountNumber)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#3e66d4] hover:bg-white transition-colors border border-transparent hover:border-slate-100"
                                            title="Sao chép"
                                        >
                                            <IoCopy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                    <span className="text-gray-500 text-sm font-medium">Gói đăng ký</span>
                                    <span className="text-gray-800 font-bold text-sm bg-blue-50 text-[#3e66d4] px-3 py-1 rounded-full border border-blue-100">
                                        Premium {plan.months} Tháng
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                    <span className="text-gray-500 text-sm font-medium">Số tiền cần chuyển</span>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-[#3e66d4]">
                                            {formatPrice(totalAfter)}đ
                                        </div>
                                        <div className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block font-semibold mt-0.5">
                                            Đã giảm 5%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-start py-2.5">
                                    <span className="text-gray-500 text-sm font-medium mt-1">Nội dung chuyển</span>
                                    <div className="flex flex-col items-end max-w-[65%]">
                                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2 w-full justify-between">
                                            <span className="font-mono text-xs text-amber-800 font-bold break-all text-right select-all">
                                                {transferContent}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(transferContent)}
                                                className="p-1 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors flex-shrink-0"
                                                title="Sao chép"
                                            >
                                                <IoCopy size={14} />
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-red-500 font-medium mt-1.5 text-right">
                                            * Lưu ý nhập chính xác nội dung này để được kích hoạt tự động.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1 h-5 rounded-full bg-[#3e66d4]" />
                                Hướng dẫn nâng cấp
                            </h3>
                            <div className="relative pl-5 border-l-2 border-slate-100 space-y-5">
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#3e66d4] text-white text-[10px] font-bold">1</span>
                                    <p className="text-sm text-gray-700 font-semibold">Quét mã QR thanh toán</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Mở app ngân hàng của bạn, sử dụng tính năng quét mã QR để điền tự động các thông tin.</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#3e66d4] text-white text-[10px] font-bold">2</span>
                                    <p className="text-sm text-gray-700 font-semibold">Kiểm tra thông tin giao dịch</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Xác nhận chính xác Số tiền, Nội dung chuyển khoản trùng khớp với thông tin mẫu.</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#3e66d4] text-white text-[10px] font-bold">3</span>
                                    <p className="text-sm text-gray-700 font-semibold">Nhấn "Tôi đã thanh toán"</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Sau khi giao dịch thành công, nhấn nút xác nhận bên phải để thông báo cho hệ thống duyệt kích hoạt.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: QR Code & Actions (5 cols) */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                        <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">
                                MÃ QR THANH TOÁN
                            </h3>
                            
                            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 transition-transform duration-300 hover:scale-[1.02] mb-4">
                                <img
                                    src={qrUrl}
                                    alt="QR chuyển khoản"
                                    className="w-44 h-44 object-contain rounded"
                                />
                            </div>

                            <Button
                                type="default"
                                onClick={onDownloadQR}
                                className="w-full max-w-[180px] hover:text-[#3e66d4] hover:border-[#3e66d4] rounded-lg font-medium shadow-sm"
                            >
                                Tải mã QR
                            </Button>
                        </div>

                        {/* Confirmation Button / Status Box */}
                        <div className="border-t border-slate-100 pt-6">
                            {orderSubmitted ? (
                                <Result
                                    status="success"
                                    icon={<FaCheckCircle className="text-green-500 text-5xl mx-auto" />}
                                    title={<span className="text-lg font-bold text-slate-800">Đã ghi nhận yêu cầu!</span>}
                                    subTitle={<span className="text-xs text-slate-500">Chúng mình đang kiểm tra số dư và kích hoạt Premium trong vài phút.</span>}
                                    extra={
                                        <Button
                                            type="primary"
                                            className="w-full bg-[#3e66d4] hover:bg-[#2c3f84]"
                                            onClick={() => navigate("/", { replace: true })}
                                        >
                                            Trở về trang chủ
                                        </Button>
                                    }
                                />
                            ) : orderError === "pending" ? (
                                <Result
                                    status="warning"
                                    icon={<FaClock className="text-amber-500 text-5xl mx-auto" />}
                                    title={<span className="text-lg font-bold text-slate-800">Đơn đang chờ duyệt</span>}
                                    subTitle={<span className="text-xs text-slate-500">Bạn đã gửi yêu cầu xác nhận thanh toán. Admin đang tiến hành đối soát.</span>}
                                    extra={
                                        <Button
                                            type="primary"
                                            className="w-full bg-[#3e66d4] hover:bg-[#2c3f84]"
                                            onClick={() => navigate("/", { replace: true })}
                                        >
                                            Trở về trang chủ
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <Button
                                        type="primary"
                                        size="large"
                                        loading={confirmLoading}
                                        onClick={handleConfirmPayment}
                                        className="w-full !h-12 !text-base !font-bold !rounded-xl transition-all duration-300"
                                        style={{
                                            background: "linear-gradient(135deg, #3e67d6 0%, #2c3f84 100%)",
                                            border: "none",
                                            boxShadow: "0 4px 15px rgba(62, 103, 214, 0.25)",
                                        }}
                                    >
                                        ✅ Tôi đã thanh toán
                                    </Button>
                                    <p className="text-[11px] text-slate-400 text-center leading-relaxed px-4">
                                        Hãy nhấn nút sau khi bạn đã hoàn tất việc chuyển khoản trên app ngân hàng.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Back/Navigation */}
                <div className="bg-[#f8fafc] border-t border-slate-100 p-6 flex justify-center gap-4">
                    <Button
                        onClick={() => navigate("/premium")}
                        className="rounded-lg hover:text-[#3e66d4] hover:border-[#3e66d4] font-medium"
                    >
                        Trở về trang nâng cấp
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => navigate("/", { replace: true })}
                        className="rounded-lg bg-[#3e66d4] hover:bg-[#2c3f84] font-medium"
                    >
                        Trở về trang chủ
                    </Button>
                </div>
            </div>

            <Modal
                open={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                footer={null}
                centered
                styles={{
                    body: { padding: 0 },
                }}
                width={400}
            >
                <div className="p-6">
                    {/* Header Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-[#3e66d4] shadow-inner">
                            <FaCheckCircle size={28} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-center text-slate-800 mb-2">
                        Xác nhận thanh toán
                    </h3>

                    <p className="text-sm text-gray-500 text-center mb-6">
                        Bạn chắc chắn đã chuyển khoản cho đơn hàng này?
                    </p>

                    {/* Summary Info Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Gói đăng ký</span>
                            <span className="text-slate-800 font-bold bg-blue-50 text-[#3e66d4] px-2.5 py-0.5 rounded-full border border-blue-100">
                                Premium {plan.months} Tháng
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">Số tiền</span>
                            <span className="text-[#3e66d4] font-black text-sm">{formatPrice(totalAfter)}đ</span>
                        </div>
                        <div className="flex justify-between items-start text-xs pt-2 border-t border-slate-200/50">
                            <span className="text-gray-400 font-medium mt-0.5">Nội dung CK</span>
                            <span className="font-mono text-[10px] text-gray-600 font-semibold bg-white border border-slate-100 px-1.5 py-0.5 rounded break-all max-w-[70%] text-right">
                                {transferContent}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-100/50 text-center leading-relaxed mb-6">
                        ⚠️ Giao dịch giả mạo hoặc sai lệch thông tin có thể dẫn đến việc từ chối kích hoạt.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="flex-1 !h-11 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 text-gray-500 transition-colors"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            loading={confirmLoading}
                            onClick={async () => {
                                setConfirmLoading(true);
                                setOrderError(null);
                                try {
                                    await callCreatePaymentOrder({
                                        premiumType: getPremiumType(),
                                        amount: totalAfter,
                                        transferContent: transferContent,
                                    });
                                    setOrderSubmitted(true);
                                    setIsConfirmModalOpen(false);
                                    message.success("Đã ghi nhận! Chúng mình sẽ xử lý trong thời gian sớm nhất.");
                                } catch (err: any) {
                                    const errMsg = err?.response?.data?.message || "Có lỗi xảy ra";
                                    if (err?.response?.data?.code === 4002) {
                                        setOrderError("pending");
                                        setIsConfirmModalOpen(false);
                                        message.info("Bạn đã gửi yêu cầu trước đó, vui lòng chờ xác nhận.");
                                    } else {
                                        setOrderError(errMsg);
                                        message.error(errMsg);
                                    }
                                } finally {
                                    setConfirmLoading(false);
                                }
                            }}
                            className="flex-1 !h-11 rounded-xl font-bold transition-all duration-300"
                            style={{
                                background: "linear-gradient(135deg, #3e67d6 0%, #2c3f84 100%)",
                                border: "none",
                            }}
                        >
                            Xác nhận
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
