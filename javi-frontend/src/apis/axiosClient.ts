import axios from "axios";
import { message } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";
import { callRefreshToken } from "./authApi";
import { useGlobalErrorStore } from "@/stores/useGlobalErrorStore";
import { usePremiumModalStore } from "@/stores/usePremiumModalStore";
import { callLogout } from "@/apis/authApi";
// import { useNavigate } from "react-router-dom";

// const navigate = useNavigate();
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000, // tránh request treo
});

// Biến module-scoped dùng cho cơ chế single-flight refresh:
// Nếu có 1 request refresh đang chạy thì các request khác sẽ chờ Promise này
let refreshTokenPromise: Promise<string | null> | null = null;

// =================== REQUEST INTERCEPTOR ===================
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =================== RESPONSE INTERCEPTOR ===================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // tạm thời comment để code tiếp
    // PHÁT HIỆN SERVER DOWN / MẤT KẾT NỐI
    if (!error.response || (error.response.status >= 500 && error.response.status <= 599)) {
      const { setServerDown } = useGlobalErrorStore.getState();
      setServerDown(true); // hiển thị <ServerError /> toàn cục
      message.error("Máy chủ đang gặp sự cố, vui lòng thử lại sau!");
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // REFRESH TOKEN LOGIC (chuẩn theo ILoginResponse)
    if (status === 401) {
      const originalRequest = error.config;

      // Nếu request chính là /auth/refresh hoặc đã retry rồi thì không thử lại nữa
      if (originalRequest._retry || originalRequest.url?.includes("/auth/refresh")) {
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        return Promise.reject(error);
      }

      // Đánh dấu flag retry trên request để tránh vòng lặp
      originalRequest._retry = true;

      // Nếu chưa có một refresh đang chạy thì tạo một Promise duy nhất
      if (!refreshTokenPromise) {
        // Tạo và gán Promise cho biến chung
        refreshTokenPromise = (async () => {
          try {
            // Gọi API refresh token — BE trả trực tiếp ILoginResponse
            const res = await callRefreshToken();

            if (res?.data?.token && res?.data?.user) {
              // Lấy lại hàm setAuth trực tiếp từ store mỗi lần gọi
              const { setAuth } = useAuthStore.getState();

              // Cập nhật lại auth store bằng ILoginResponse thật
              setAuth(res.data);

              // Trả về token để các request chờ dùng
              return res.data.token;
            } else {
              // Nếu response không hợp lệ — coi là failure
              throw new Error("Invalid refresh response");
            }
          } catch (e) {
            // Refresh thất bại → giữ nguyên flow logout/clearAuth hiện tại
            const { clearAuth } = useAuthStore.getState();
            message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
            try {
              // đã thử refresh và thất bại
              await callLogout(); // gọi server để xóa cookie httpOnly (axiosNoAuth)
            } catch (logoutErr) {
              // logout request có thể lỗi (network) -> log nhưng vẫn tiếp tục
              console.error("Server logout failed:", logoutErr);
            } finally {
              clearAuth(); // xóa token / user khỏi FE
              window.location.href = "/"; // điều hướng về trang chủ
            }
            // Re-throw để các request chờ nhận biết là refresh failed
            throw e;
          } finally {
            // Reset biến chung khi hoàn thành (thành công hoặc thất bại)
            refreshTokenPromise = null;
          }
        })();
      }

      try {
        // Chờ kết quả của refresh chung (các request khác sẽ chờ vào cùng Promise này)
        const newToken = await refreshTokenPromise;

        if (newToken) {
          // Gọi lại request cũ với token mới
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        }

        return Promise.reject(error);
      } catch (e) {
        // Nếu refresh bị lỗi thì trả reject (clearAuth đã được gọi trong block trên)
        return Promise.reject(e);
      }
    }

    // Bắt lỗi vượt hạn mức AI hàng ngày (code 4004)
    if (error.response?.data?.code === 4004) {
      usePremiumModalStore.getState().openModal();
      return Promise.reject(error);
    }

    // Các lỗi còn lại để page tự handle (400, 403, 404,...)
    return Promise.reject(error);
  }
);

export default axiosClient;
