# 📅 JAVI-DICTIONARY — LỊCH TRÌNH TRIỂN KHAI CHI TIẾT (TIMELINE)

> **Tổng thời gian dự kiến:** ~30 ngày làm việc (6 tuần, mỗi tuần 5 ngày)
> **Giờ làm việc ước tính:** 6-8 giờ/ngày
> **Tham chiếu:** [MASTER_PLAN.md](./MASTER_PLAN.md) để xem chi tiết kỹ thuật từng mục

---

## TỔNG QUAN GIAI ĐOẠN

```
TUẦN 1-2 ──► Hạ tầng & Dữ liệu & Auth nền tảng
TUẦN 3   ──► Core Features: Tra cứu đa năng + Chủ đề + JLPT
TUẦN 4   ──► AI Features: Dịch thuật + Giải thích + Kiểm tra ngữ pháp
TUẦN 5   ──► Speaking Ladder + Flashcard SRS
TUẦN 6   ──► Thanh toán VietQR + Polish + Deploy
```

---

## 🗓️ TUẦN 1: HẠ TẦNG, DATABASE & AUTHENTICATION (Ngày 1-5)

### Ngày 1 — Khởi tạo dự án & Cấu hình môi trường

- [ ] Khởi tạo project Backend Spring Boot (Java 21, pom.xml dependencies)
- [ ] Khởi tạo project Frontend React + TypeScript + Vite
- [ ] Cấu hình Tailwind CSS, Ant Design, Zustand, react-router-dom
- [ ] Cấu hình alias path (`@/`) cho Frontend
- [ ] Setup MySQL local + Redis local
- [ ] Cấu hình `application.yaml` (datasource, redis, jwt, mail, cors)
- [ ] Tạo file `.env` quản lý biến môi trường (DB_USERNAME, JWT_KEY, GEMINI_KEY, etc.)

### Ngày 2 — Thiết kế Database & Entity JPA

- [ ] Tạo `BaseEntity.java` (createdAt, updatedAt, createdBy, updatedBy)
- [ ] Tạo Entity: `Users`, `Role`, `Permission`, `Token`, `VerificationToken`
- [ ] Tạo Entity: `Vocabularies`, `Meaning`, `MeaningExample`
- [ ] Tạo Entity: `Kanji`
- [ ] Tạo Entity: `Grammar`, `GrammarExample`
- [ ] Tạo Entity: `Topic` (MỚI) + bảng trung gian `vocabulary_topics`
- [ ] Tạo Entity: `Comment`, `CommentReaction`
- [ ] Tạo Entity: `Translation`, `HistorySearch`
- [ ] Tạo Entity: `Flashcard` (MỚI)
- [ ] Tạo các Enum: `JlptLevel`, `AccountType`, `Status`, `EngineType`, `EntityType`, `WordType`, `TokenType`, `ReactionType`
- [ ] Chạy Hibernate `ddl-auto: update` để sinh bảng → Kiểm tra cấu trúc

### Ngày 3 — Repository, DTO, Mapper & Security Config

- [ ] Tạo tất cả JPA Repository interfaces
- [ ] Tạo Request/Response DTOs (RegisterRequest, LoginRequest, LoginResponse, ApiResponse, etc.)
- [ ] Cấu hình MapStruct Mappers
- [ ] Cấu hình Spring Security: SecurityFilterChain, JwtDecoder, CorsConfiguration
- [ ] Cấu hình Cookie Service cho Refresh Token (HttpOnly)
- [ ] Tạo SecurityUtil (getCurrentUser)
- [ ] Cấu hình Global Exception Handler

### Ngày 4 — Authentication & Authorization

- [ ] Implement AuthService: register, login, logout, refreshToken
- [ ] Implement TokenService: createAccessToken, createRefreshToken, verify
- [ ] Implement VerificationTokenService: sendVerificationEmail, verifyToken, resetPassword
- [ ] Implement Google OAuth 2.0 login flow (GoogleService)
- [ ] Implement CookieService: createRefreshTokenCookie, clearRefreshTokenCookie
- [ ] Tạo AuthController với đầy đủ endpoints
- [ ] Test toàn bộ flow Auth bằng Postman/Thunder Client

### Ngày 5 — Frontend Auth Pages & Axios Client

- [ ] Cấu hình axiosClient.ts: baseURL, interceptors request (Bearer token), interceptors response (auto refresh 401)
- [ ] Tạo useAuthStore (Zustand): token, user, setAuth, clearAuth
- [ ] Tạo useGlobalErrorStore: serverDown state
- [ ] Tạo authApi.ts: callLogin, callRegister, callRefreshToken, callLogout
- [ ] Tạo LoginPage.tsx (Form đăng nhập Email + Google OAuth button)
- [ ] Tạo RegisterPage.tsx
- [ ] Tạo VerifyEmailPage.tsx
- [ ] Tạo ResetPasswordPage.tsx
- [ ] Tạo OAuthCallbackPage.tsx
- [ ] Tạo ProtectedRoute component + RequirePermission component
- [ ] Tạo MainLayout.tsx (Header, Sidebar, Outlet)

---

## 🗓️ TUẦN 2: ADMIN DASHBOARD, RBAC & SEED DATA (Ngày 6-10)

### Ngày 6 — Admin CRUD: Users + Roles + Permissions

- [ ] BE: UsersController, UsersService (getAll, getById, create, update, delete, changeStatus, changePassword)
- [ ] BE: RoleController, RoleService (CRUD + gắn permissions)
- [ ] BE: PermissionController, PermissionService (CRUD)
- [ ] FE: AdminUsers.tsx (ProTable, Modal Create/Edit, Block/Unblock)
- [ ] FE: AdminRoles.tsx (ProTable, Transfer permissions)
- [ ] FE: AdminPermissions.tsx (ProTable, Modal Create/Edit)

### Ngày 7 — Admin CRUD: Vocabulary + Kanji + Grammar

- [ ] BE: VocabulariesController, VocabulariesService (CRUD + filter + pagination)
- [ ] BE: KanjiController, KanjiService (CRUD + filter + upload GIF to R2)
- [ ] BE: GrammarController, GrammarService (CRUD + filter)
- [ ] FE: AdminVocabulary.tsx (ProTable, Modal với danh sách Meanings + Examples động)
- [ ] FE: AdminKanji.tsx (ProTable, Modal upload GIF)
- [ ] FE: AdminGrammar.tsx (ProTable, Modal với Examples động)

### Ngày 8 — Admin CRUD: Topics + Seed Data Import

- [ ] BE: TopicController, TopicService (CRUD)
- [ ] FE: AdminTopics.tsx (Quản lý chủ đề: TRAVEL, WORKPLACE, SCHOOL, etc.)
- [ ] BE: Viết Seed Script import dữ liệu từ điển JMdict/Nhật-Việt vào MySQL
- [ ] BE: Viết script gán Topics cho từ vựng theo danh mục
- [ ] Chạy script và kiểm tra dữ liệu

### Ngày 9 — Cấu hình Cloudflare R2 & File Upload

- [ ] BE: Cấu hình S3Client → Cloudflare R2 endpoint
- [ ] BE: AvatarStorageService (upload, delete, resize ảnh bằng Thumbnailator)
- [ ] BE: KanjiGifStorageService (upload, delete GIF Kanji)
- [ ] BE: FileController (upload/download endpoints)
- [ ] FE: UserDetailPage.tsx (Trang cá nhân, đổi avatar, cập nhật thông tin, đổi mật khẩu)
- [ ] Test toàn bộ luồng upload ảnh

### Ngày 10 — Rate Limiting & Redis Cache Config

- [ ] BE: Cấu hình Bucket4j hoặc Redis-based Rate Limiter
- [ ] BE: Áp dụng rate limit cho các API AI (translateAI, explainWord, checkGrammar, analyzeKanji, voiceEvaluate)
- [ ] BE: Cấu hình Redis Cache cho các API tra cứu phổ biến (getVocabulary, getKanji, getGrammar)
- [ ] Test rate limiting: Gửi quá giới hạn → Nhận HTTP 429

---

## 🗓️ TUẦN 3: CORE FEATURES — TRA CỨU ĐA NĂNG (Ngày 11-15)

### Ngày 11 — Trang chủ Search & Tra cứu Từ vựng

- [ ] FE: SearchLayout.tsx, SearchHome.tsx (Tabs: Từ vựng / Kanji / Ngữ pháp)
- [ ] FE: SearchHomeContent.tsx (Thanh tìm kiếm với wanakana auto-convert)
- [ ] BE: API search vocabulary với spring-filter (filter by keyword, level, topic)
- [ ] FE: VocabularyResult.tsx (Hiển thị chi tiết từ: Kana, Romaji, Loại từ, Nghĩa, Ví dụ, Kanji liên quan)
- [ ] FE: VocabularyListPage.tsx (Danh sách từ vựng theo JLPT + Topic grid)

### Ngày 12 — Tra cứu Kanji + SVG Stroke Player

- [ ] FE: KanjiResult.tsx (Chi tiết Kanji: On/Kun, số nét, nghĩa Hán Việt)
- [ ] FE: KanjiDetail.tsx component
- [ ] FE: Tích hợp SVG Stroke-Order Player (KanjiVG data + CSS stroke-dashoffset animation)
- [ ] FE: KanjiList.tsx (Grid Kanji theo cấp độ JLPT)

### Ngày 13 — Tra cứu Ngữ pháp + Lọc theo Chủ đề

- [ ] FE: GrammarSearchHome.tsx, GrammarResult.tsx
- [ ] FE: Trang lọc từ vựng theo Chủ đề (Topic Grid Cards: Du lịch, Công sở, Trường học...)
- [ ] FE: Trang JLPT (JlptPage.tsx) — Hiển thị từ vựng/Kanji/Grammar theo N5-N1
- [ ] BE: Đảm bảo API filter chéo hoạt động: `level:'N3' and topics.code:'TRAVEL'`

### Ngày 14 — Hệ thống Comment + Like/Dislike + Lịch sử

- [ ] BE: CommentController, CommentService (CRUD + phân trang)
- [ ] BE: CommentReactionController (toggleLike, toggleDislike)
- [ ] FE: Comment component (danh sách comment, form viết comment, nút like/dislike)
- [ ] FE: Tích hợp comment vào VocabularyResult, KanjiResult, GrammarResult
- [ ] BE: HistorySearchController, HistorySearchService (lưu & trả lịch sử)
- [ ] FE: History modal/drawer hiển thị lịch sử tra cứu

### Ngày 15 — Intro Page + UX Polish cho Search

- [ ] FE: IntroPage.tsx (Landing page giới thiệu Javi)
- [ ] FE: NotFound.tsx (404 page)
- [ ] FE: ServerError component (hiển thị khi server down)
- [ ] FE: Responsive testing trên mobile breakpoints
- [ ] FE: Loading skeletons, empty states, error boundaries
- [ ] Test toàn bộ luồng tra cứu end-to-end

---

## 🗓️ TUẦN 4: AI FEATURES — DỊCH THUẬT & PHÂN TÍCH (Ngày 16-20)

### Ngày 16 — Cấu hình Spring AI + Google Translate

- [ ] BE: Cấu hình Spring AI ChatClient → Gemini 2.5-flash endpoint
- [ ] BE: GoogleTranslateService (dịch nhanh bằng Google Translate API miễn phí)
- [ ] BE: TranslateService (phân luồng GOOGLE vs AI engine)
- [ ] BE: TranslateController endpoints

### Ngày 17 — Trang Dịch thuật (TranslatePage)

- [ ] FE: TranslatePage.tsx (Multi-block translate layout)
- [ ] FE: TranslateBlock.tsx (Source textarea + Target display + Swap + Engine selector)
- [ ] FE: Tích hợp chọn engine: "Dịch thường" (Google) vs "Dịch AI" (Gemini)
- [ ] FE: Luồng chống spam (snapshot so sánh, debounce)
- [ ] Test dịch Nhật ↔ Việt cả 2 engine

### Ngày 18 — Dịch ảnh OCR + Image Cropper

- [ ] BE: SmartOcrServiceImpl (Google Vision API + normalizeOcrText)
- [ ] BE: GeminiService.translateImage (OCR → Dịch AI)
- [ ] FE: Tích hợp react-easy-crop vào TranslateBlock (Mobile-friendly crop)
- [ ] FE: Upload ảnh → Crop → Gửi file lên BE → Hiển thị kết quả dịch
- [ ] Test dịch ảnh chụp sách tiếng Nhật

### Ngày 19 — Giải thích từ AI + Kiểm tra ngữ pháp AI

- [ ] BE: GeminiService.explainWord (Prompt giải thích từ vựng ngữ cảnh)
- [ ] BE: GeminiService.checkGrammar (Prompt kiểm tra + chấm điểm + gợi ý sửa)
- [ ] FE: Nút "Giải thích AI" trong VocabularyResult → Modal hiển thị giải thích
- [ ] FE: Nút "Phân tích" trong TranslateBlock → Panel kết quả ngữ pháp (xanh/đỏ)
- [ ] Tích hợp RAG: Query DB trước → Nạp context vào Prompt

### Ngày 20 — Phân tích cấu trúc Kanji AI + Force Graph

- [ ] BE: GeminiService.analyzeKanjiStructure (Prompt phân rã 3 cấp → JSON → DTO)
- [ ] FE: KanjiDecompositionModal.tsx (Force Graph 2D trực quan hoá cây Kanji)
- [ ] FE: Nút "Phân tích cấu trúc" trong KanjiResult → Mở modal
- [ ] FE: Tích hợp nút Flag "Báo cáo lỗi" dưới mọi output AI
- [ ] FE: Disclaimer text dưới output AI
- [ ] Test toàn bộ tính năng AI end-to-end

---

## 🗓️ TUẦN 5: SPEAKING LADDER + FLASHCARD SRS (Ngày 21-25)

### Ngày 21 — Backend Voice Evaluation API

- [ ] BE: Thêm dependency Google Cloud TTS (hoặc sử dụng REST API trực tiếp)
- [ ] BE: VoiceEvaluationController: `POST /api/v1/voice/evaluate` (Cấp 1 & 2)
- [ ] BE: VoiceEvaluationController: `POST /api/v1/voice/evaluate-chat` (Cấp 3)
- [ ] BE: VoiceEvaluationService: evaluatePronunciation (Gemini Multimodal Audio input)
- [ ] BE: TtsService: generateSpeech (Google Cloud TTS ja-JP-Neural2-C → lưu R2 hoặc trả stream)
- [ ] BE: VoiceChatRequest/VoiceChatResponse DTOs
- [ ] BE: Prompt Engineering cho 3 cấp độ (READ_REPEAT, GUIDED, FREE_CHAT)

### Ngày 22 — Frontend Speaking UI: Cấp 1 (Read & Repeat)

- [ ] FE: SpeakingPage.tsx (Chọn cấp độ JLPT + Chọn chế độ luyện)
- [ ] FE: ReadRepeatMode.tsx component:
  - Hiển thị câu mẫu tiếng Nhật (với Furigana)
  - Nút phát âm chuẩn (Audio player)
  - Nút Mic thu âm (MediaRecorder API)
  - Gửi audio lên BE
  - Hiển thị kết quả: Vòng tròn điểm + Bôi đỏ từ sai
- [ ] FE: WordAnalysisDisplay.tsx (Highlight từ đúng/sai với tooltip giải thích)

### Ngày 23 — Frontend Speaking UI: Cấp 2 (Guided) + Cấp 3 (Free Chat)

- [ ] FE: GuidedDialogueMode.tsx:
  - AI đưa câu hỏi + 3 phương án gợi ý
  - User chọn 1 phương án + Đọc to
  - Hiển thị kết quả chấm điểm + Chuyển lượt tiếp
- [ ] FE: FreeChatMode.tsx:
  - Giao diện bong bóng chat 2 bên
  - AI hỏi (không gợi ý) → User nói tự do
  - Hiển thị: STT text + Điểm phát âm + Gợi ý ngữ pháp
  - Giới hạn 5 lượt → Bảng tổng kết + Confetti
- [ ] FE: Responsive testing trên mobile

### Ngày 24 — Flashcard SRS Backend

- [ ] BE: FlashcardController: addToStudyDeck, getCardsForReview, submitReview
- [ ] BE: FlashcardService:
  - addFlashcard (lưu từ/Kanji/grammar vào sổ tay)
  - getDueCards (lấy các thẻ cần ôn hôm nay: nextReviewDate <= today)
  - processReview (thuật toán SM-2: cập nhật easeFactor, intervalDays, nextReviewDate)
- [ ] BE: Implement thuật toán SuperMemo-2
- [ ] BE: Scheduled email reminder (Spring @Scheduled + Mail): Gửi nhắc nhở ôn tập buổi sáng

### Ngày 25 — Flashcard SRS Frontend

- [ ] FE: StudyDeckPage.tsx (Danh sách sổ tay + số thẻ cần ôn hôm nay)
- [ ] FE: FlashcardReviewPage.tsx:
  - Card flip animation (CSS 3D transform)
  - Mặt trước: Từ tiếng Nhật
  - Mặt sau: Nghĩa + Ví dụ + Cách đọc
  - 4 nút đánh giá: Again / Hard / Good / Easy
  - Progress bar (đã ôn X/Y thẻ)
- [ ] FE: Nút "Lưu vào sổ tay" trong VocabularyResult, KanjiResult, GrammarResult
- [ ] Test luồng SRS end-to-end (thêm thẻ → ôn → check ngày ôn tiếp)

---

## 🗓️ TUẦN 6: THANH TOÁN, POLISH & DEPLOY (Ngày 26-30)

### Ngày 26 — Tích hợp VietQR Webhook tự động

- [ ] Đăng ký tài khoản PayOS/SePay/Casso
- [ ] BE: PaymentController: createQrCode, handleWebhook
- [ ] BE: PaymentService: generateQr, verifyWebhookSignature, activatePremium
- [ ] FE: UpgradePage.tsx (Bảng giá 4 gói cước đẹp mắt)
- [ ] FE: ConfirmPremiumPage.tsx (Hiển thị QR code + countdown chờ thanh toán)
- [ ] FE: Hiệu ứng Confetti khi thanh toán thành công
- [ ] Test toàn bộ luồng thanh toán end-to-end

### Ngày 27 — PWA + Double Caching + Viral Word Card

- [ ] FE: Cấu hình vite-plugin-pwa (Service Worker, Web App Manifest, icons)
- [ ] FE: IndexedDB cache cho kết quả tra cứu (thư viện idb)
- [ ] FE: WordCardGenerator component:
  - Chọn mẫu hình nền nghệ thuật
  - Canvas API vẽ Kanji + Furigana + Nghĩa lên ảnh
  - Nút "Tải về" + Nút "Chia sẻ"
  - Logo "Javi.click" watermark nhỏ góc ảnh

### Ngày 28 — AppRoutes hoàn chỉnh + Responsive Polish

- [ ] FE: Cập nhật AppRoutes.tsx đầy đủ tất cả routes mới
- [ ] FE: Mobile-first responsive testing toàn bộ pages
- [ ] FE: Dark mode support (nếu kịp thời gian)
- [ ] FE: Loading states, error boundaries, empty states đồng bộ
- [ ] FE: SEO: Title tags, meta descriptions, semantic HTML cho mỗi page
- [ ] Smoke test toàn bộ ứng dụng trên Chrome, Safari, Firefox

### Ngày 29 — Deploy lên Production

- [ ] BE: Đóng gói JAR (`mvn clean package`)
- [ ] BE: Deploy lên VPS (DigitalOcean/Vultr/AWS EC2) hoặc Railway/Render
- [ ] BE: Cấu hình MySQL production + Redis production
- [ ] BE: Cấu hình SSL (Let's Encrypt) + Reverse Proxy (Nginx)
- [ ] BE: Thiết lập biến môi trường production (.env)
- [ ] FE: Build production (`npm run build`)
- [ ] FE: Deploy static files lên Cloudflare Pages hoặc Vercel hoặc Nginx
- [ ] Cấu hình domain (ví dụ: javi.click)
- [ ] Test production: Auth flow, tra cứu, dịch, AI features, thanh toán

### Ngày 30 — Kiểm thử cuối & Soft Launch

- [ ] Kiểm thử bảo mật: SQL injection, XSS, CSRF
- [ ] Kiểm thử hiệu năng: Load test API chính
- [ ] Kiểm tra Rate Limiting hoạt động đúng
- [ ] Kiểm tra email verification + reset password flow trên production
- [ ] Viết README.md hướng dẫn cài đặt dự án
- [ ] Tạo tài khoản Admin đầu tiên + Seed permissions/roles mặc định
- [ ] **🎉 SOFT LAUNCH:** Chia sẻ link cho nhóm bạn bè / cộng đồng học tiếng Nhật để thu thập feedback

---

## 📊 TỔNG KẾT PHÂN BỔ THỜI GIAN

| Giai đoạn       | Thời gian  | Nội dung chính                                               |
| ----------------- | ----------- | -------------------------------------------------------------- |
| **Tuần 1** | Ngày 1-5   | Hạ tầng, Database, Auth, Security                            |
| **Tuần 2** | Ngày 6-10  | Admin Dashboard, RBAC, Seed Data, Rate Limiting                |
| **Tuần 3** | Ngày 11-15 | Tra cứu đa năng, Lọc JLPT + Topic, Comment, Lịch sử      |
| **Tuần 4** | Ngày 16-20 | Dịch thuật, OCR, AI giải thích, AI ngữ pháp, Kanji Graph |
| **Tuần 5** | Ngày 21-25 | Speaking Ladder (3 cấp), Flashcard SRS                        |
| **Tuần 6** | Ngày 26-30 | VietQR thanh toán, PWA, Polish, Deploy, Soft Launch           |

> [!IMPORTANT]
> **Lưu ý:** Timeline này ước tính cho 1 developer full-time làm việc 6-8 giờ/ngày. Nếu bạn làm part-time (3-4 giờ/ngày), hãy nhân đôi thời gian (~60 ngày / 12 tuần). Các tính năng được sắp xếp theo thứ tự ưu tiên: nếu cần cắt giảm scope, hãy ưu tiên hoàn thành Tuần 1-4 trước (Core features) và chuyển Tuần 5-6 sang giai đoạn phát triển tiếp theo sau khi Soft Launch.
