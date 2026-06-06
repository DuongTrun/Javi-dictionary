import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Button, message } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";
import momo from "@/assets/momo.png";
import mbbank from "@/assets/mbbank.png";
import { AiFillExclamationCircle } from "react-icons/ai";

type Plan = {
    id: string;
    months: number;
    price: string; // "499.000"
    originalPrice?: string; // "719.000"
    highlight?: boolean;
    bgUrl?: string;
    type?: string;
};

export default function ConfirmPremiumPage(): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    // Lấy plan từ location.state (UpgradePage truyền vào)
    const state: any = location.state ?? {};
    const plan: Plan | undefined = state.plan;

    // Nếu không có plan -> quay về trang chọn gói
    useEffect(() => {
        if (!plan) {
            navigate("/premium");
        }
    }, [plan, navigate]);

    if (!plan) return <div />;

    // Lấy user từ store (username / email).
    const user = useAuthStore((s: any) => s.user);

    // Helpers parse/format tiền
    const parsePrice = (p?: string) => {
        if (!p) return 0;
        const digits = p.replace(/\./g, "").replace(/[^\d]/g, "");
        return parseInt(digits || "0", 10);
    };
    const formatPrice = (v: number) =>
        v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // base numbers
    const basePriceNum = useMemo(() => parsePrice(plan.price), [plan.price]);

    // Payment method state
    const [payment, setPayment] = useState<"momo" | "bank">("momo");

    // Nếu chọn chuyển khoản -> giảm 5% (làm tròn theo nghìn)
    const javiDiscount =
        payment === "bank"
            ? Math.round((basePriceNum * 0.05) / 1000) * 1000
            : 0;
    const totalAfter = basePriceNum - javiDiscount;

    // xử lý submit
    // xử lý submit
    const onSubmit = async () => {
        if (loading) return; // ngăn spam
        setLoading(true);
        try {
            // tạo mã nội dung chuyển khoản tạm (sẽ thay bằng orderRef từ backend khi tích hợp)
            const orderRef = `TH${Math.random()
                .toString(36)
                .slice(2, 12)
                .toUpperCase()}`;

            // Nếu người dùng chọn chuyển khoản → chuyển sang trang BankPaymentConfirmPage
            if (payment === "bank") {
                navigate("/premium/bank-confirm", {
                    state: {
                        plan: plan,
                        orderRef: orderRef,
                        amount: totalAfter,
                    },
                });
                return;
            }

            // Nếu chọn MoMo → hiện thông báo tạm thời (không điều hướng)
            if (payment === "momo") {
                message.warning(
                    "Tính năng thanh toán bằng MoMo đang được phát triển."
                );
                return;
            }

            // Các phương thức thanh toán khác (tạm điều hướng về premium)
            navigate("/premium");
        } catch (err) {
            // bắt lỗi chung (nếu cần)
            console.error(err);
            message.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Link fake cho "Điều kiện & Điều khoản" và "Chính sách..."
    const onFakeLink = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <div className="mt-10 px-2">
            <div className="w-full">
                {" "}
                {/* đảm bảo toàn bộ vùng dùng 100% width */}
                <div className="text-sm text-gray-500 font-normal flex items-center justify-start mb-6">
                    <button
                        className="text-blue-600 hover:underline font-normal mr-1"
                        onClick={() => navigate("/premium")}
                        aria-label="Quay về trang nâng cấp"
                    >
                        Nâng cấp
                    </button>
                    <h2 className="font-normal">/ Thanh toán</h2>
                </div>
                {/* Layout 2 cột: mỗi cột bằng nhau */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT: Thông tin gói + Hình thức thanh toán (cột trái, chiếm 6/12) */}
                    <div className="lg:col-span-6">
                        <div className="bg-white rounded-2xl shadow-sm p-3 font-normal w-full">
                            {/* đảm bảo 100% width */}
                            <div className="mb-4">
                                <div className="text-base font-normal text-black">
                                    Thông tin gói Đăng ký
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                <div className="py-3 flex justify-between items-center">
                                    <div className="text-sm text-gray-600 font-normal">
                                        Tên gói Đăng ký
                                    </div>
                                    <div className="text-sm text-gray-900 font-normal">
                                        Javi Premium - {plan.months} Tháng
                                    </div>
                                </div>

                                <div className="py-3 flex justify-between items-center">
                                    <div className="text-sm text-gray-600 font-normal">
                                        Thời gian
                                    </div>
                                    <div className="text-sm text-gray-900 font-normal">
                                        {plan.months} Tháng
                                    </div>
                                </div>

                                <div className="py-3 flex justify-between items-center">
                                    <div className="text-sm text-gray-600 font-normal">
                                        Giá gói
                                    </div>
                                    <div className="text-sm text-gray-900 font-normal flex items-center gap-3">
                                        {/* Nếu có originalPrice thì show gạch ngang (như màn premium) */}
                                        {plan.originalPrice ? (
                                            <span className="text-sm text-gray-500 line-through">
                                                {plan.originalPrice} đ
                                            </span>
                                        ) : null}
                                        <span className="text-sm text-gray-900">
                                            {plan.price} đ
                                        </span>
                                    </div>
                                </div>

                                {/* Thanh toán qua Javi (Giảm 5%) - chỉ hiện khi chọn chuyển khoản */}
                                {payment === "bank" && (
                                    <div className="py-3 flex justify-between items-center">
                                        <div className="text-sm text-gray-600 font-normal">
                                            Thanh toán qua Javi (Giảm 5%)
                                        </div>
                                        <div className="text-sm text-red-600 font-normal">
                                            - {formatPrice(javiDiscount)} đ
                                        </div>
                                    </div>
                                )}

                                {/* Nếu chọn bank: hiển thị Tổng thanh toán ngay dưới Thanh toán qua Javi */}
                                {payment === "bank" && (
                                    <div className="flex justify-between items-center py-3 text-sm font-normal text-gray-700">
                                        <div className="text-gray-600 font-normal">
                                            Tổng thanh toán:
                                        </div>
                                        <div className="text-lg text-[#3e67d6] font-medium">
                                            {formatPrice(totalAfter)} đ
                                        </div>
                                    </div>
                                )}

                                {/* Nếu chọn momo: hiện Tổng thanh toán ngay dưới Giá gói */}
                                {payment === "momo" && (
                                    <div className="py-3 flex justify-between items-center">
                                        <div className="text-sm text-gray-600 font-normal">
                                            Tổng thanh toán
                                        </div>
                                        <div className="text-lg text-[#3e67d6] font-medium">
                                            {formatPrice(basePriceNum)} đ
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Hình thức thanh toán (nằm ở cột trái) */}
                        <div className="mt-3 bg-white rounded-2xl shadow-sm p-3 font-normal w-full">
                            <div className="text-sm text-gray-700 mb-3 font-normal">
                                Hình thức thanh toán
                            </div>

                            {/* grid 2 cột trên desktop, 1 cột mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Momo */}
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all w-full cursor-pointer ${
                                        payment === "momo"
                                            ? "border-[#3e67d6] bg-[#f1f5fd]"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                    onClick={() => setPayment("momo")}
                                >
                                    <img
                                        src={momo}
                                        alt="momo"
                                        className="w-9 h-9 object-cover shadow-md rounded-md"
                                    />
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-normal text-gray-900">
                                            Thanh toán bằng Ví MoMo
                                        </div>
                                        <div className="text-xs font-normal text-gray-500">
                                            Thanh toán nhanh qua Momo
                                        </div>
                                    </div>

                                    <input
                                        type="radio"
                                        name="payment"
                                        value="momo"
                                        checked={payment === "momo"}
                                        onChange={() => setPayment("momo")}
                                        className="hidden"
                                    />
                                    <span
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                            payment === "momo"
                                                ? "border-[#3e67d6]"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`${
                                                payment === "momo"
                                                    ? "w-2.5 h-2.5 rounded-full bg-[#3e67d6]"
                                                    : "w-2.5 h-2.5 rounded-full bg-transparent"
                                            }`}
                                        />
                                    </span>
                                </label>

                                {/* Bank */}
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all w-full cursor-pointer ${
                                        payment === "bank"
                                            ? "border-green-600 bg-green-50"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                    onClick={() => setPayment("bank")}
                                >
                                    <img
                                        src={mbbank}
                                        alt="bank"
                                        className="w-9 h-9 object-contain bg-white p-1 shadow-md rounded-md"
                                    />
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-normal text-gray-900">
                                            Chuyển khoản (MB Bank)
                                        </div>
                                        <div className="text-xs font-normal text-[#ec2028]">
                                            (Giảm 5%)
                                        </div>
                                    </div>

                                    <input
                                        type="radio"
                                        name="payment"
                                        value="bank"
                                        checked={payment === "bank"}
                                        onChange={() => setPayment("bank")}
                                        className="hidden"
                                    />
                                    <span
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                            payment === "bank"
                                                ? "border-green-600"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`${
                                                payment === "bank"
                                                    ? "w-2.5 h-2.5 rounded-full bg-green-600"
                                                    : "w-2.5 h-2.5 rounded-full bg-transparent"
                                            }`}
                                        />
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Thông tin cá nhân (cột phải, chiếm 6/12) */}
                    <div className="lg:col-span-6">
                        <div className="bg-white rounded-2xl shadow-sm p-3 font-normal w-full">
                            <div className="mb-3">
                                <div className="text-base font-normal text-black">
                                    Thông tin cá nhân
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="px-3 py-[10px] rounded-md bg-[#f0f5fd] border border-[#27429b]">
                                    <div className="text-xs text-[#0090ff] font-normal flex items-start gap-1">
                                        <AiFillExclamationCircle className="text-lg" />
                                        Gói nâng cấp và tất cả quyền lợi đi kèm
                                        sẽ được thêm vào tài khoản này sau khi
                                        quá trình thanh toán thành công!
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="text-sm text-gray-700 mb-1 font-normal">
                                    Họ và tên
                                </div>
                                <Input
                                    disabled
                                    size="large"
                                    value={
                                        user?.fullName ?? user?.username ?? ""
                                    }
                                    className="bg-[#f3f4f6] rounded-md"
                                />
                            </div>

                            <div className="mb-3">
                                <div className="text-sm text-gray-700 mb-1 font-normal">
                                    Tài khoản nâng cấp
                                </div>
                                <Input
                                    disabled
                                    size="large"
                                    value={user?.email ?? ""}
                                    className="bg-[#f3f4f6] rounded-md"
                                />
                            </div>

                            <div className="text-xs text-gray-600 mt-2 font-normal">
                                Bằng việc nhấn{" "}
                                <span className="font-medium text-[#111]">
                                    Tiếp tục thanh toán
                                </span>{" "}
                                bạn xác nhận đã đọc và đồng ý với{" "}
                                <a
                                    href="#"
                                    onClick={onFakeLink}
                                    className="text-blue-500 hover:underline"
                                >
                                    Điều kiện & Điều khoản
                                </a>{" "}
                                cùng{" "}
                                <a
                                    href="#"
                                    onClick={onFakeLink}
                                    className="text-blue-500 hover:underline"
                                >
                                    Chính sách bảo mật thông tin
                                </a>{" "}
                                của Javi.
                            </div>

                            {/* Nút "Tiếp tục thanh toán" chuyển vào cột phải như yêu cầu */}
                            <div className="mt-6">
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={onSubmit}
                                    loading={loading}
                                    className="font-normal bg-[#3e67d6] h-11"
                                >
                                    Tiếp tục thanh toán
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
