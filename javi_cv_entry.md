# PROJECT
---
**JAVI DICTIONARY - THƯ VIỆN & TỪ ĐIỂN TIẾNG NHẬT THÔNG MINH TÍCH HỢP AI**  
*12/2025 - 06/2026*

**Full-stack Developer**  
*   **Link Github:** [https://github.com/DuyHieuzz/Javi-dictionary](https://github.com/DuyHieuzz/Javi-dictionary)
*   **Tech Stack:**
    *   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Ant Design, Zustand, Axios, react-force-graph-2d.
    *   **Backend:** Java 21, Spring Boot, Spring Security, JWT (nimbus-jose-jwt), Spring Data JPA, Spring AI.
    *   **Database:** MySQL, Redis.
    *   **Tools & Others:** Gemini AI, Google Cloud Vision API (OCR), Cloudflare R2, VietQR Webhook.

**Project Overview:**
*   Phát triển nền tảng học tiếng Nhật và tra cứu thông minh tích hợp trí tuệ nhân tạo (AI), hệ thống thẻ nhớ ôn tập ngắt quãng (Flashcard SRS), và trợ lý luyện nói Kaiwa tương tác trực tiếp.
*   Dự án tập trung tối ưu hóa hiệu năng truy vấn dữ liệu từ điển lớn, phân quyền bảo mật chặt chẽ, tích hợp các dịch vụ bên thứ ba (OCR, Cloud Storage, AI) và tự động hóa quy trình nâng cấp tài khoản Premium thông qua cổng thanh toán QR Code tự động.

**Key Features:**
*   **Authentication & Authorization System:**
    *   Triển khai cơ chế đăng nhập bảo mật (JWT) và đăng nhập mạng xã hội (Google OAuth2).
    *   Thiết kế hệ thống phân quyền Role-Based Access Control (RBAC) chi tiết để bảo vệ API và Frontend routes.
*   **AI Context Explanation & Smart Search:**
    *   Xây dựng công cụ tra cứu Từ vựng/Kanji/Ngữ pháp tích hợp Redis Cache giúp tối ưu tốc độ phản hồi.
    *   Tích hợp Gemini AI giải nghĩa từ vựng theo ngữ cảnh thực tế và phân tích lỗi ngữ pháp chi tiết.
    *   Trực quan hóa cấu trúc bộ thủ Kanji bằng đồ thị động 2D (sử dụng `react-force-graph-2d`).
*   **AI Speaking Coach & Spaced Repetition (SRS):**
    *   Phát triển trợ lý luyện nói tiếng Nhật (Kaiwa) sử dụng Web Audio API ghi âm trực tiếp và AI chấm điểm phát âm.
    *   Tích hợp hệ thống thẻ nhớ ôn tập ngắt quãng dựa trên thuật toán SuperMemo-2 (SM-2) tăng hiệu quả ghi nhớ.
*   **VietQR Webhook & Premium Control:**
    *   Tự động hóa nâng cấp Premium qua VietQR động và xác nhận giao dịch tự động qua Webhook ngân hàng.
    *   Thiết lập giới hạn gọi AI hàng ngày (5 lượt/ngày) cho tài khoản Free và hiển thị popup gợi ý nâng cấp Premium.
