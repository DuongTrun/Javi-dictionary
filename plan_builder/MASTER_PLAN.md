# 🗺️ JAVI-DICTIONARY — BẢN TỔNG HỢP KIẾN TRÚC & KẾ HOẠCH PHÁT TRIỂN TOÀN DIỆN

> **Ngày lập:** 01/06/2026  
> **Nền tảng mục tiêu:** Web (Desktop & Mobile responsive)  
> **Mục tiêu:** Deploy thử nghiệm → Thu hút người dùng đầu tiên → Thương mại hoá qua gói Premium

---

## MỤC LỤC

1. [Tổng quan kiến trúc hiện tại](#1-tổng-quan-kiến-trúc-hiện-tại)
2. [Hoàn thiện các tính năng chưa tối ưu](#2-hoàn-thiện-các-tính-năng-chưa-tối-ưu)
3. [Phân loại từ vựng theo Cấp độ JLPT & Chủ đề](#3-phân-loại-từ-vựng-theo-cấp-độ-jlpt--chủ-đề)
4. [Hệ thống Flashcard SRS (Spaced Repetition System)](#4-hệ-thống-flashcard-srs-spaced-repetition-system)
5. [Hệ thống Luyện nói phân cấp (Speaking Ladder)](#5-hệ-thống-luyện-nói-phân-cấp-speaking-ladder)
6. [Kiểm soát chất lượng AI — Mô hình 4 lớp](#6-kiểm-soát-chất-lượng-ai--mô-hình-4-lớp)
7. [Chiến lược dữ liệu lớn & Từ đồng âm](#7-chiến-lược-dữ-liệu-lớn--từ-đồng-âm)
8. [Chiến lược vận hành Bootstrapping cho Indie Dev](#8-chiến-lược-vận-hành-bootstrapping-cho-indie-dev)
9. [Các cải tiến kỹ thuật & UX nâng cao](#9-các-cải-tiến-kỹ-thuật--ux-nâng-cao)
10. [Tổng hợp Tech Stack đầy đủ](#10-tổng-hợp-tech-stack-đầy-đủ)

---

## 1. TỔNG QUAN KIẾN TRÚC HIỆN TẠI

### 1.1 Mô hình kiến trúc

```
[Frontend React App] ⇄ [Axios Client + JWT Interceptors] ⇄ [Spring Boot REST API] ⇄ [MySQL / Redis Cache]
                                                                      │
                                                      ┌───────────────┼───────────────┐
                                                      ▼               ▼               ▼
                                               [Gemini 2.5-flash] [Google Vision] [Cloudflare R2]
```

### 1.2 Frontend hiện tại
| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Framework | React + TypeScript | v18.3.1 |
| Build Tool | Vite | v5.4.2 |
| UI Library | Ant Design + Pro Components | v5.27.5 |
| State Management | Zustand | v5.0.8 |
| CSS Framework | Tailwind CSS | v3.4.18 |
| Đồ thị Kanji | react-force-graph-2d | v1.29.0 |
| Xử lý tiếng Nhật | wanakana | v5.3.1 |
| Router | react-router-dom | v7.9.4 |
| Animation | framer-motion | v12.23 |

### 1.3 Backend hiện tại
| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Framework | Spring Boot + Java 21 | v3.5.6 |
| ORM | Spring Data JPA (Hibernate) | - |
| Database | MySQL | - |
| Cache | Redis (Spring Data Redis) | - |
| Security | Spring Security + OAuth2 Resource Server | - |
| JWT | nimbus-jose-jwt | v10.5 |
| AI Engine | Spring AI OpenAI → Gemini 2.5-flash | v1.0.3 |
| OCR | Google Cloud Vision API (REST) | - |
| Language Detection | Lingua | v1.2.2 |
| Object Storage | Cloudflare R2 (AWS S3 SDK) | v2.29 |
| Email | Spring Boot Mail + Spring Retry | - |
| Dynamic Filter | spring-filter (Turkraft) | v3.1.9 |
| Mapping | MapStruct + Lombok | v1.6.3 |

### 1.4 Các chức năng hiện có trong code gốc
- **Tra cứu đa năng:** Từ vựng (Vocabulary), Hán tự (Kanji), Ngữ pháp (Grammar)
- **Dịch thuật:** Dịch văn bản (Google Translate + AI Gemini), Dịch ảnh OCR (Premium)
- **Phân tích Hán tự 3 cấp:** Gemini phân rã Kanji → Đồ thị Force Graph 2D (Premium)
- **Kiểm tra ngữ pháp:** Gemini chấm điểm & gợi ý sửa lỗi (Premium)
- **Giải thích từ vựng AI:** Gemini giải nghĩa ngữ cảnh thực tế
- **Hệ thống comment:** Bình luận + Like/Dislike trên Từ vựng, Kanji, Ngữ pháp
- **Lịch sử tra cứu:** Ghi nhận và hiển thị lịch sử tìm kiếm
- **Auth đa nền tảng:** Email/Password + Google OAuth 2.0 + Email Verification + Reset Password
- **Phân quyền RBAC:** Permissions → Roles → Users (bảo vệ cả FE routes lẫn BE endpoints)
- **Admin Dashboard:** CRUD Từ vựng, Kanji, Ngữ pháp, Users, Roles, Permissions
- **Premium:** Nâng cấp VIP (1 tháng/3 tháng/6 tháng/Trọn đời) — Thanh toán thủ công chuyển khoản

---

## 2. HOÀN THIỆN CÁC TÍNH NĂNG CHƯA TỐI ƯU

### 2.1 Tự động hoá Cổng thanh toán quét mã QR (VietQR Webhook)

**Hiện trạng:** Trang `BankPaymentConfirmPage.tsx` yêu cầu user chuyển khoản → tải ảnh biên lai → chờ Admin duyệt thủ công. Quy trình chậm, giảm tỷ lệ chuyển đổi.

**Giải pháp nâng cấp:**

```
[User chọn gói Premium] → [BE sinh mã QR VietQR động] → [User quét QR chuyển khoản]
                                                                    │
                                                                    ▼
                                                     [Ngân hàng gửi Webhook callback]
                                                                    │
                                                                    ▼
                                                    [Spring Boot Webhook Controller]
                                                    Xác minh chữ ký → Cập nhật DB:
                                                    accountType = PREMIUM
                                                    premiumExpiredAt = now + gói cước
                                                                    │
                                                                    ▼
                                                    [FE nhận thông báo realtime]
                                                    Hiệu ứng Confetti chúc mừng!
```

**Các bước triển khai:**
1. Đăng ký tài khoản tại **PayOS** (payos.vn) hoặc **SePay** hoặc **Casso** — đều cung cấp Webhook callback biến động số dư miễn phí hoặc chi phí rất thấp.
2. Tạo `PaymentController.java` phía Backend:
   - `POST /api/v1/payment/create-qr` — Sinh mã QR chứa số tiền + nội dung chuyển khoản duy nhất (ví dụ: `JAVI_PREMIUM_{userId}_{timestamp}`).
   - `POST /api/v1/payment/webhook` — Endpoint nhận callback từ cổng thanh toán khi có biến động số dư. Xác minh chữ ký bảo mật → cập nhật `accountType` và `premiumExpiredAt`.
3. Frontend hiển thị mã QR và polling trạng thái thanh toán (hoặc dùng Server-Sent Events để realtime).

### 2.2 Tối ưu Dịch ảnh OCR di động (Mobile Image Cropper)

**Hiện trạng:** Phần upload ảnh OCR dùng Ant Design Upload mặc định, chưa tối ưu cho điện thoại.

**Giải pháp nâng cấp:**
- Tích hợp thư viện **react-image-crop** hoặc **react-easy-crop** ở Frontend.
- Luồng hoạt động: Chụp ảnh/Chọn ảnh → Hiển thị giao diện crop → User khoanh vùng chữ tiếng Nhật cần dịch → Gửi ảnh đã crop lên Backend.
- Lợi ích: Giảm dung lượng ảnh tải lên, loại bỏ nhiễu xung quanh, tăng độ chính xác OCR Google Vision.

### 2.3 Rate Limiting chống spam API AI

**Lý do:** API Gemini và Google Vision tốn tiền theo lượt gọi. Cần bảo vệ trước khi có doanh thu.

**Giải pháp:**
- Sử dụng **Bucket4j** hoặc tận dụng Redis hiện có để làm Rate Limiter.
- Cấu hình hạn ngạch mẫu:

| Tính năng | Tài khoản FREE | Tài khoản PREMIUM |
|---|---|---|
| Dịch AI | 10 lượt/ngày | Không giới hạn |
| Dịch ảnh OCR | 3 lượt/ngày | 50 lượt/ngày |
| Giải thích từ AI | 15 lượt/ngày | Không giới hạn |
| Kiểm tra ngữ pháp | 0 (Khoá) | Không giới hạn |
| Phân tích Kanji AI | 0 (Khoá) | Không giới hạn |
| Luyện nói AI | 3 lượt/ngày | 30 lượt/ngày |

---

## 3. PHÂN LOẠI TỪ VỰNG THEO CẤP ĐỘ JLPT & CHỦ ĐỀ

### 3.1 Thiết kế Database

Mỗi từ vựng vừa thuộc một cấp độ JLPT (N1-N5) vừa có thể nằm trong nhiều chủ đề khác nhau → Quan hệ **Many-to-Many**.

**Thực thể mới: `Topic.java`**
```java
@Entity
@Table(name = "topics")
public class Topic extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;        // "TRAVEL", "WORKPLACE", "SCHOOL", "DAILY_LIFE", "FOOD"...

    @Column(nullable = false, length = 100)
    private String nameVn;      // "Du lịch", "Công sở", "Trường học"...

    @Column(nullable = false, length = 100)
    private String nameJp;      // "旅行", "ビジネス", "学校"...

    private String description;
    private String iconUrl;
}
```

**Cập nhật `Vocabularies.java`:**
```java
@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(
    name = "vocabulary_topics",
    joinColumns = @JoinColumn(name = "vocabulary_id"),
    inverseJoinColumns = @JoinColumn(name = "topic_id")
)
private Set<Topic> topics = new HashSet<>();
```

### 3.2 Danh sách chủ đề gợi ý ban đầu

| Mã Code | Tên tiếng Việt | Tên tiếng Nhật | Mô tả |
|---|---|---|---|
| `DAILY_LIFE` | Giao tiếp hàng ngày | 日常会話 | Chào hỏi, mua sắm, gia đình |
| `TRAVEL` | Du lịch | 旅行 | Hỏi đường, khách sạn, phương tiện |
| `WORKPLACE` | Công sở / Làm việc | ビジネス | Họp, email, giao tiếp đồng nghiệp |
| `SCHOOL` | Trường học | 学校 | Lớp học, bài tập, thầy cô |
| `FOOD` | Ẩm thực | 食べ物 | Nhà hàng, nấu ăn, gọi món |
| `HEALTH` | Y tế / Sức khoẻ | 健康 | Bệnh viện, triệu chứng, thuốc |
| `CULTURE` | Văn hoá Nhật Bản | 文化 | Lễ hội, phong tục, anime/manga |
| `IT_TECH` | Công nghệ thông tin | IT技術 | Lập trình, họp online, thuật ngữ IT |
| `PART_TIME` | Làm thêm (Baito) | アルバイト | Cửa hàng tiện lợi, nhà hàng, tuyển dụng |

### 3.3 API Lọc chéo (Nhờ spring-filter có sẵn)

```
GET /api/v1/vocabularies?filter=level:'N3' and topics.code:'TRAVEL'
GET /api/v1/vocabularies?filter=topics.code:'WORKPLACE'
GET /api/v1/vocabularies?filter=level:'N5' and topics.code:'DAILY_LIFE'
```

---

## 4. HỆ THỐNG FLASHCARD SRS (SPACED REPETITION SYSTEM)

### 4.1 Nguyên lý hoạt động

Thuật toán **SuperMemo-2 (SM-2)** tính khoảng thời gian ôn tập tối ưu dựa trên chất lượng trả lời của người học:

```
[User lưu từ vào Sổ tay] → [Hệ thống tạo Flashcard]
           │
           ▼
[Hiển thị mặt trước: Từ tiếng Nhật]
           │
           ▼
[User tự đánh giá: Again / Hard / Good / Easy]
           │
           ▼
[SM-2 tính toán khoảng cách ôn tập tiếp theo]
  - Again: Ôn lại ngay (1 phút)
  - Hard: Ôn sau 1 ngày
  - Good: Ôn sau 3 ngày
  - Easy: Ôn sau 7 ngày
  (Hệ số nhân tăng dần theo chuỗi trả lời đúng liên tiếp)
           │
           ▼
[Gửi email nhắc nhở ôn tập hàng ngày vào buổi sáng]
```

### 4.2 Thiết kế Database

```java
@Entity
@Table(name = "flashcards")
public class Flashcard extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;

    private String entityType;     // "VOCABULARY", "KANJI", "GRAMMAR"
    private Long entityId;

    private int repetitions;       // Số lần ôn thành công liên tiếp
    private double easeFactor;     // Hệ số dễ (khởi tạo = 2.5)
    private int intervalDays;      // Khoảng cách ngày ôn tiếp theo
    private LocalDate nextReviewDate; // Ngày cần ôn tiếp theo
    private LocalDate lastReviewDate;
}
```

### 4.3 Giao diện Flashcard

- Thiết kế mặt trước/mặt sau (Flip Card) bằng CSS 3D transform
- Mặt trước: Chữ Kanji/Từ vựng/Mẫu ngữ pháp
- Mặt sau: Nghĩa tiếng Việt, ví dụ, cách đọc
- 4 nút đánh giá: Again (Đỏ) / Hard (Cam) / Good (Xanh lá) / Easy (Xanh dương)

---

## 5. HỆ THỐNG LUYỆN NÓI PHÂN CẤP (SPEAKING LADDER)

### 5.1 Tổng quan 3 cấp độ

```
┌──────────────────────────────────────────────────────────────┐
│ CẤP ĐỘ 1: ĐỌC THEO MẪU (Read & Repeat)                    │
│ Đối tượng: N5 - N4 (Sơ cấp)                                │
│ Cách thức: Hệ thống hiển thị 1 câu mẫu cố định →           │
│           User nghe phát âm chuẩn → User đọc theo →          │
│           AI chỉ chấm điểm phát âm (không kiểm tra ngữ pháp)│
├──────────────────────────────────────────────────────────────┤
│ CẤP ĐỘ 2: HỘI THOẠI CÓ GỢI Ý (Guided Dialogue)           │
│ Đối tượng: N3 - N2 (Trung cấp)                             │
│ Cách thức: AI đưa ra câu hỏi → Hiển thị 3 phương án gợi ý  │
│           → User chọn 1 phương án và đọc to → AI chấm điểm  │
│           phát âm + xác nhận câu trả lời → Chuyển lượt tiếp  │
├──────────────────────────────────────────────────────────────┤
│ CẤP ĐỘ 3: HỘI THOẠI TỰ DO (Free Chat Kaiwa)              │
│ Đối tượng: N1 (Cao cấp)                                    │
│ Cách thức: AI hỏi → Không hiển thị gợi ý → User tự nghĩ    │
│           và nói tự do → AI nhận diện giọng nói + chấm điểm │
│           phát âm + kiểm tra ngữ pháp + đưa câu đáp tiếp   │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Luồng kỹ thuật (Cấp độ 1 & 2: Đọc theo mẫu / Có gợi ý)

```
[User nhấn Mic] → [MediaRecorder API thu âm WebM 16kHz Mono]
       │
       ▼
[FE gửi: POST /api/v1/voice/evaluate]
  Body: { audio: MultipartFile, targetText: "câu mẫu cố định" }
       │
       ▼
[BE → Gemini 2.5-flash (Multimodal Audio Input)]
  Prompt: "So sánh file âm thanh với câu mẫu '%s'.
           Chấm điểm phát âm 0-100.
           Chỉ rõ từ nào phát âm sai, thiếu trường âm, sai âm ngắt."
       │
       ▼
[Gemini trả JSON: { score, feedback, wordsAnalysis[] }]
       │
       ▼
[FE hiển thị: Vòng tròn điểm số + Bôi đỏ từ sai + Nút nghe phát âm chuẩn]
```

### 5.3 Luồng kỹ thuật (Cấp độ 3: Hội thoại tự do)

```
[User nói tự do] → [MediaRecorder API thu âm]
       │
       ▼
[FE gửi: POST /api/v1/voice/evaluate-chat]
  Body: { audio, topicCode, chatHistoryJson }
       │
       ▼
[BE → Gemini 2.5-flash — Thực hiện đồng thời 3 tác vụ trong 1 lần gọi:]
  1. STT: Nhận diện chữ tiếng Nhật từ Audio
  2. Evaluation: Chấm điểm phát âm + Kiểm tra ngữ pháp
  3. Next Step: Nghĩ câu đáp tiếp theo phù hợp ngữ cảnh
       │
       ▼
[BE → Google Cloud TTS (ja-JP-Neural2-C)]
  Sinh file MP3 phát âm chuẩn cho câu đáp tiếp của AI
       │
       ▼
[Trả VoiceChatResponse DTO về FE]
  { userSpokenText, userSpokenTranslation, pronunciationScore,
    pronunciationFeedback, isGrammarValid, grammarFeedback,
    nextAiResponseText, nextAiResponseTranslation, nextAiResponseAudioUrl }
       │
       ▼
[FE hiển thị: Bong bóng chat 2 bên + Điểm số + Bôi đỏ lỗi + Gợi ý sửa]
[Giới hạn 5 lượt đối đáp → Bảng tổng kết + Confetti]
```

### 5.4 DTO chính

**Request — `VoiceChatRequest.java`:**
```java
public class VoiceChatRequest {
    private MultipartFile audio;
    private String topicCode;           // Mã chủ đề
    private String jlptLevel;           // "N5","N4","N3","N2","N1"
    private String speakingMode;        // "READ_REPEAT", "GUIDED", "FREE_CHAT"
    private String expectedText;        // Câu mẫu cố định (dùng cho mode READ_REPEAT & GUIDED)
    private String chatHistoryJson;     // Lịch sử hội thoại (dùng cho mode FREE_CHAT)
}
```

**Response — `VoiceChatResponse.java`:**
```java
public class VoiceChatResponse {
    // Kết quả phân tích câu nói User
    private String userSpokenText;
    private String userSpokenTranslation;
    private int pronunciationScore;
    private String pronunciationFeedback;
    private boolean isGrammarValid;
    private String grammarFeedback;
    private List<WordAnalysis> wordsAnalysis;

    // Câu đáp tiếp theo của AI (chỉ dùng cho GUIDED & FREE_CHAT)
    private String nextAiResponseText;
    private String nextAiResponseTranslation;
    private String nextAiResponseAudioUrl;
}
```

---

## 6. KIỂM SOÁT CHẤT LƯỢNG AI — MÔ HÌNH 4 LỚP

```
┌──────────────────────────────────────────────────────────────┐
│ LỚP 1: NEO DỮ LIỆU RAG (Retrieval-Augmented Generation)   │
│ • Query DB chuyên gia trước → Nạp làm Context cho Gemini    │
│ • AI chỉ "hành văn" giải thích, KHÔNG tự bịa nghĩa         │
│ • Giảm tỷ lệ sai xuống ~0% cho nghĩa từ vựng               │
├──────────────────────────────────────────────────────────────┤
│ LỚP 2: GIỚI HẠN KỸ THUẬT (System Guardrails)               │
│ • Temperature = 0.1 (AI logic, nhất quán, ít sáng tạo)      │
│ • Bắt AI trả confidenceScore (0-100)                        │
│ • confidenceScore < 80 → Gắn cờ cảnh báo hoặc chuyển Admin │
│ • Schema JSON cứng → Tránh output lạc đề                    │
├──────────────────────────────────────────────────────────────┤
│ LỚP 3: GHI ĐÈ THỦ CÔNG (Manual Override & Cache)           │
│ • Admin/Giáo viên viết lại giải thích chuẩn trên Dashboard  │
│ • Lưu vào DB + Đồng bộ Redis Cache                          │
│ • Lần sau tra cứu → Trả ngay bản ghi đè, không gọi Gemini  │
│ • Hệ thống ngày càng chính xác hơn theo thời gian           │
├──────────────────────────────────────────────────────────────┤
│ LỚP 4: PHẢN HỒI CỘNG ĐỒNG (Crowdsourced QA)               │
│ • Nút "Báo cáo lỗi" (Flag Icon) dưới mọi output AI         │
│ • Report → Vào hàng đợi kiểm duyệt Admin                   │
│ • User báo đúng lỗi → Thưởng 3 ngày Premium miễn phí        │
│ • Tạo đội ngũ QA miễn phí từ cộng đồng N2/N1                │
└──────────────────────────────────────────────────────────────┘
```

**UX Disclaimer (Ghi chú minh bạch) dưới mọi output AI:**
> *"💡 Kết quả được hỗ trợ bởi công nghệ AI. Nếu phát hiện điểm chưa chính xác, hãy bấm 'Góp ý' để giúp Javi hoàn thiện và nhận ngay quà tặng Premium!"*

---

## 7. CHIẾN LƯỢC DỮ LIỆU LỚN & TỪ ĐỒNG ÂM

### 7.1 Nguồn dữ liệu từ điển

- **Không cần biên soạn thủ công.** Sử dụng bộ dữ liệu mã nguồn mở **JMdict** (cộng đồng kiểm duyệt suốt 20+ năm) hoặc các bộ từ điển Nhật-Việt chia sẻ rộng rãi.
- Viết **Seed Script** (Spring Boot CLI Runner) để import bộ dữ liệu vào MySQL một lần duy nhất.

### 7.2 Hiệu năng truy vấn

- Tạo **Database Index** cho các cột: `word`, `hiragana`, `romaji`, `level`.
- Thời gian tìm kiếm 1 từ trong 200,000+ bản ghi: **< 5ms**.

### 7.3 Xử lý từ đồng âm (Homonyms)

```
User tra: "はし" (hashi)
     │
     ▼
[MySQL query: SELECT * FROM vocabularies WHERE hiragana = 'はし']
     │
     ├── Bản ghi 1: 箸 (Đũa)
     ├── Bản ghi 2: 橋 (Cầu)
     └── Bản ghi 3: 端 (Rìa)
     │
     ▼
[Nạp cả 3 bản ghi vào Prompt Gemini làm Context]
     │
     ▼
[Gemini phân tích ngữ cảnh → Hiển thị cả 3 nghĩa cho User]
"Từ 'はし' có 3 nghĩa: 箸 (Đũa), 橋 (Cầu), 端 (Rìa). 
 Dựa trên ngữ cảnh câu bạn nhập, nghĩa phù hợp nhất là..."
```

---

## 8. CHIẾN LƯỢC VẬN HÀNH BOOTSTRAPPING CHO INDIE DEV

### 8.1 Giai đoạn MVP (Không biết tiếng Nhật, không thuê ai)

Khi user báo cáo lỗi AI, Developer thực hiện quy trình **3 bước tự kiểm chứng:**

1. **Copy** phản hồi của user + câu trả lời AI trên hệ thống.
2. **Dán** vào GPT-4o/Claude và hỏi bằng tiếng Việt: *"User bảo AI sai chỗ này, hãy phân tích khách quan xem ai đúng."*
3. **Nếu user đúng:** Bấm "Duyệt" trên Admin Dashboard → Hệ thống ghi đè + tặng Premium cho user.

**Thời gian xử lý mỗi ticket: ~1 phút.**

### 8.2 Giai đoạn Tăng trưởng (App đã có doanh thu)

- Thuê sinh viên tiếng Nhật làm cộng tác viên bán thời gian.
- Trả theo hiệu suất (Pay-per-Ticket): 5,000đ - 10,000đ/ticket.
- Chi phí biến đổi tỷ lệ thuận với quy mô app → Không có rủi ro tài chính.

---

## 9. CÁC CẢI TIẾN KỸ THUẬT & UX NÂNG CAO

### 9.1 SVG Kanji Stroke-Order Player
- Thay thế GIF tĩnh bằng **SVG animation** (dữ liệu từ dự án mã nguồn mở KanjiVG).
- CSS `stroke-dashoffset` vẽ nét mượt mà, vector sắc nét.
- Hỗ trợ Play / Pause / Slow Motion / Step-by-Step.

### 9.2 Progressive Web App (PWA)
- Cấu hình **Service Worker** + **Web App Manifest**.
- User bấm "Thêm vào màn hình chính" → Cài app không qua Store.
- Offline caching: Tra được từ đã học khi mất mạng.

### 9.3 Double Caching (Bộ nhớ đệm kép)
- **Frontend Cache (IndexedDB):** Lưu kết quả tra cứu và audio TTS trên trình duyệt → Tra lại hiển thị tức thì 0ms.
- **Server Cache (Redis):** Lưu kết quả tra cứu phổ biến → Giảm tải MySQL khi nhiều user.

### 9.4 Thẻ từ vựng nghệ thuật chia sẻ mạng xã hội (Viral Word Card)
- User lưu từ tâm đắc → Chọn mẫu hình nền nghệ thuật → Hệ thống vẽ Kanji + Furigana + Nghĩa lên ảnh.
- Tải về làm hình nền hoặc chia sẻ Facebook/Instagram.
- Logo "Javi.click" nhỏ ở góc ảnh → Quảng cáo truyền miệng miễn phí.

---

## 10. TỔNG HỢP TECH STACK ĐẦY ĐỦ (PHIÊN BẢN NÂNG CẤP)

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| UI Library | Ant Design 5 + Pro Components |
| State | Zustand |
| CSS | Tailwind CSS 3 |
| Router | react-router-dom 7 |
| Animation | framer-motion |
| Đồ thị Kanji | react-force-graph-2d |
| Xử lý Kana | wanakana |
| Image Crop | react-easy-crop *(MỚI)* |
| Offline Cache | IndexedDB (idb) *(MỚI)* |
| PWA | vite-plugin-pwa *(MỚI)* |
| Audio Recorder | MediaRecorder API (native) *(MỚI)* |

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | Spring Boot 3.5 + Java 21 |
| ORM | Spring Data JPA (Hibernate) |
| Database | MySQL |
| Cache | Redis |
| Security | Spring Security + OAuth2 + JWT |
| AI Engine | Spring AI → Gemini 2.5-flash |
| OCR | Google Cloud Vision API |
| TTS | Google Cloud Text-to-Speech *(MỚI)* |
| Payment | PayOS / SePay VietQR Webhook *(MỚI)* |
| Rate Limiter | Bucket4j / Redis *(MỚI)* |
| Object Storage | Cloudflare R2 (S3 SDK) |
| Email | Spring Mail + Retry |
| Language Detect | Lingua |
| Dynamic Filter | spring-filter |
| Mapping | MapStruct + Lombok |

---

> **Ghi chú:** Tài liệu này là bản tổng hợp hoàn chỉnh tất cả các cuộc thảo luận về thiết kế kiến trúc, tính năng mới, nguyên lý hoạt động và chiến lược vận hành của dự án Javi-dictionary phiên bản nâng cấp. File lịch trình triển khai chi tiết xem tại `TIMELINE.md` trong cùng thư mục.
