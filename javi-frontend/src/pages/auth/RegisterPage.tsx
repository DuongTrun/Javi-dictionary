import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
// import axiosClient from "../../apis/axiosClient"; <-- replaced by callRegister
import { callRegister } from "../../apis/authApi";
import { TbMailFilled } from "react-icons/tb";
import { HiMiniLockClosed } from "react-icons/hi2";
import { toast } from "react-toastify";

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
    }>({});

    const handleGoogleRegister = () => {
        // Lấy from từ state nếu có (RequireLoginModal/other pages có thể truyền)
        const stateFrom = (location.state as any)?.from;

        let redirect = stateFrom
            ? stateFrom
            : location.pathname + location.search + location.hash;

        // Nếu redirect trỏ về /login hoặc /register thì đổi sang /search (không muốn redirect về 2 route này)
        if (redirect.startsWith("/login") || redirect.startsWith("/register")) {
            redirect = "/search";
        }

        // Lưu redirect để OAuthCallbackPage dùng sau khi exchange token
        localStorage.setItem("javi_oauth_redirect", redirect);

        // Redirect sang backend OAuth endpoint (giữ nguyên endpoint của bạn)
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Validate cục bộ
        const newErrors: typeof errors = {};
        if (!email) newErrors.email = "Bạn chưa nhập địa chỉ email";
        if (!password) newErrors.password = "Cần nhập mật khẩu";
        else if (password.length < 6)
            newErrors.password = "Mật khẩu phải từ 6 ký tự trở lên";
        if (!confirmPassword)
            newErrors.confirmPassword = "Bạn chưa xác nhận mật khẩu";
        else if (confirmPassword !== password)
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        if (!acceptTerms)
            newErrors.terms = "Bạn chưa đồng ý với điều khoản sử dụng";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);
            // dùng callRegister từ authApi (axiosClient đã cấu hình withCredentials)
            await callRegister(email, password, confirmPassword);

            // Thông báo thành công bằng toast
            toast.success(
                "Đăng ký thành công! Bạn có thể đăng nhập ngay để học nhé.",
                { position: "top-right" }
            );

            // Điều hướng về /login
            navigate("/login");
        } catch (err: any) {
            console.error("Register failed:", err);

            const code = err?.response?.data?.errorCode;
            const message =
                err?.response?.data?.message ||
                "Đăng ký thất bại, vui lòng thử lại.";

            // Mapping lỗi theo BE và hiển thị toast tương ứng
            if (code === "EXIST_EMAIL") {
                setErrors({ email: "Email đã tồn tại" });
                toast.error("Email đã tồn tại.", { position: "top-right" });
            } else if (code === "EMAIL_NOT_VERIFIED") {
                setErrors({
                    email: "Email đã tồn tại nhưng chưa xác minh. Hệ thống đã gửi lại email xác minh mới.",
                });
                toast.info(
                    "Email từng đăng ký nhưng chưa xác minh. Hệ thống đã gửi lại email xác minh mới!",
                    { position: "top-right" }
                );
                navigate("/search");
            } else if (code === "MISMATCH_PASSWORD") {
                // chưa chỉnh lại mã code be nên sau này đổi sau, để đây cho dễ hiểu
                setErrors({
                    confirmPassword: "Mật khẩu xác nhận không khớp",
                });
                toast.error("Mật khẩu xác nhận không khớp.", {
                    position: "top-right",
                });
            } else {
                toast.error(message, { position: "top-right" });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 px-2 lg:px-0">
            <div className="bg-white w-[870px] rounded-2xl shadow-md flex flex-col items-center px-4 py-8">
                {/* Tiêu đề */}
                <h2 className="text-xl mb-5">Đăng ký với</h2>

                {/* Đăng ký Google */}
                <button
                    onClick={handleGoogleRegister}
                    className="w-full max-w-md flex items-center justify-center border border-gray-300 rounded-lg py-3 mb-8 hover:bg-gray-50 transition"
                >
                    <FcGoogle className="text-3xl mr-2" />
                    <span className="text-gray-700 font-medium text-base">
                        Google
                    </span>
                </button>

                {/* Hoặc */}
                <div className="relative flex items-center w-full max-w-md mb-8">
                    <div className="flex-grow border-t border-dotted border-gray-300"></div>
                    <span className="px-3 text-base text-gray-500">
                        hoặc dùng email và mật khẩu
                    </span>
                    <div className="flex-grow border-t border-dotted border-gray-300"></div>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="w-full max-w-md space-y-3">
                    {/* Email */}
                    <div>
                        <label className="block text-base text-gray-600 mb-2">
                            Email
                        </label>
                        <div
                            className={`flex items-center border rounded-lg px-3 ${
                                errors.email
                                    ? "border-red-400 focus-within:border-red-500"
                                    : "border-gray-300 focus-within:border-blue-500"
                            }`}
                        >
                            <TbMailFilled className="text-gray-400 text-xl mr-2" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Nhập email của bạn"
                                className="w-full py-2.5 outline-none text-gray-700"
                            />
                        </div>
                        <p
                            className={`text-red-500 text-sm mt-1 min-h-[20px] transition-opacity duration-200 ${
                                errors.email
                                    ? "opacity-100 visible"
                                    : "opacity-0 invisible"
                            }`}
                        >
                            {errors.email || "placeholder"}
                        </p>
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="block text-base text-gray-600 mb-2">
                            Mật khẩu
                        </label>
                        <div
                            className={`flex items-center border rounded-lg px-3 ${
                                errors.password
                                    ? "border-red-400 focus-within:border-red-500"
                                    : "border-gray-300 focus-within:border-blue-500"
                            }`}
                        >
                            <HiMiniLockClosed className="text-gray-400 text-xl mr-2" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Nhập mật khẩu"
                                className="w-full py-2.5 outline-none text-gray-700"
                            />
                            <div
                                className="cursor-pointer text-gray-400 text-xl"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <IoEyeOutline />
                                ) : (
                                    <IoEyeOffOutline />
                                )}
                            </div>
                        </div>
                        <p
                            className={`text-red-500 text-sm mt-1 min-h-[20px] transition-opacity duration-200 ${
                                errors.password
                                    ? "opacity-100 visible"
                                    : "opacity-0 invisible"
                            }`}
                        >
                            {errors.password || "placeholder"}
                        </p>
                    </div>

                    {/* Nhập lại mật khẩu */}
                    <div>
                        <label className="block text-base text-gray-600 mb-2">
                            Nhập lại mật khẩu
                        </label>
                        <div
                            className={`flex items-center border rounded-lg px-3 ${
                                errors.confirmPassword
                                    ? "border-red-400 focus-within:border-red-500"
                                    : "border-gray-300 focus-within:border-blue-500"
                            }`}
                        >
                            <HiMiniLockClosed className="text-gray-400 text-xl mr-2" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full py-2.5 outline-none text-gray-700"
                            />
                            <div
                                className="cursor-pointer text-gray-400 text-xl"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? (
                                    <IoEyeOutline />
                                ) : (
                                    <IoEyeOffOutline />
                                )}
                            </div>
                        </div>
                        <p
                            className={`text-red-500 text-sm mt-1 min-h-[20px] transition-opacity duration-200 ${
                                errors.confirmPassword
                                    ? "opacity-100 visible"
                                    : "opacity-0 invisible"
                            }`}
                        >
                            {errors.confirmPassword || "placeholder"}
                        </p>
                    </div>

                    {/* Checkbox điều khoản */}
                    <div className="flex items-start gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-1 accent-blue-600 cursor-pointer"
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm text-gray-600"
                        >
                            Bằng cách đăng ký, bạn đồng ý với{" "}
                            <a
                                href="#"
                                className="text-blue-500 hover:underline"
                            >
                                điều khoản dịch vụ{" "}
                            </a>
                            và{" "}
                            <a
                                href="#"
                                className="text-blue-500 hover:underline"
                            >
                                chính sách bảo mật
                            </a>{" "}
                            của chúng tôi.
                        </label>
                    </div>
                    <p
                        className={`text-red-500 text-sm mt-1 min-h-[20px] transition-opacity duration-200 ${
                            errors.terms
                                ? "opacity-100 visible"
                                : "opacity-0 invisible"
                        }`}
                    >
                        {errors.terms || "placeholder"}
                    </p>

                    {/* Nút đăng ký */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                {/* Chuyển sang đăng nhập */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Bạn đã có tài khoản?{" "}
                    <span
                        onClick={() => navigate("/login")}
                        className="text-blue-500 cursor-pointer hover:underline"
                    >
                        Đăng nhập
                    </span>
                </p>
            </div>
        </div>
    );
}
