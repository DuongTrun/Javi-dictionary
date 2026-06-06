# 📖 BẢNG GIẢI THÍCH THUẬT NGỮ, TỪ VIẾT TẮT & CÔNG NGHỆ

> Tài liệu bổ trợ cho [MASTER_PLAN.md](./MASTER_PLAN.md)  
> Giải thích chi tiết tất cả các từ viết tắt, thuật ngữ kỹ thuật và công nghệ được đề cập trong bản kế hoạch.

---

## MỤC LỤC

1. [Từ viết tắt tổng quát](#1-từ-viết-tắt-tổng-quát)
2. [Công nghệ Frontend chi tiết](#2-công-nghệ-frontend-chi-tiết)
3. [Công nghệ Backend chi tiết](#3-công-nghệ-backend-chi-tiết)
4. [Dịch vụ bên thứ ba (Third-party Services)](#4-dịch-vụ-bên-thứ-ba-third-party-services)
5. [Thuật ngữ kiến trúc & Design Pattern](#5-thuật-ngữ-kiến-trúc--design-pattern)
6. [Thuật ngữ tiếng Nhật trong dự án](#6-thuật-ngữ-tiếng-nhật-trong-dự-án)

---

## 1. TỪ VIẾT TẮT TỔNG QUÁT

| Viết tắt | Tên đầy đủ | Giải thích |
|---|---|---|
| **FE** | Frontend | Phần giao diện người dùng chạy trên trình duyệt (React App). |
| **BE** | Backend | Phần xử lý logic phía máy chủ (Spring Boot App). |
| **DB** | Database | Cơ sở dữ liệu lưu trữ thông tin (MySQL). |
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng — cách FE và BE giao tiếp với nhau qua các endpoint HTTP (GET, POST, PUT, DELETE). |
| **REST** | Representational State Transfer | Kiến trúc thiết kế API phổ biến nhất hiện nay. Mỗi URL đại diện cho một tài nguyên (resource), sử dụng các method HTTP để thao tác. |
| **DTO** | Data Transfer Object | Đối tượng chuyển giao dữ liệu — lớp Java chỉ chứa dữ liệu (không có logic), dùng để truyền dữ liệu giữa các tầng (Controller ↔ Service ↔ Client). |
| **CRUD** | Create, Read, Update, Delete | 4 thao tác cơ bản với dữ liệu: Tạo mới, Đọc, Cập nhật, Xóa. |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò. Mỗi user được gán một Role (Admin, User,...), mỗi Role chứa nhiều Permissions (quyền hạn cụ thể). |
| **JWT** | JSON Web Token | Chuỗi mã hoá dùng để xác thực người dùng. FE gửi JWT trong mỗi request để BE biết "ai đang gọi API này". Token có thời hạn (ví dụ: 15 phút). |
| **OAuth 2.0** | Open Authorization 2.0 | Giao thức đăng nhập bằng tài khoản bên thứ ba (Google, Facebook,...). User không cần tạo mật khẩu riêng cho app của bạn. |
| **SSO** | Single Sign-On | Đăng nhập một lần, truy cập nhiều ứng dụng. Google OAuth là một dạng SSO. |
| **ORM** | Object-Relational Mapping | Kỹ thuật ánh xạ bảng trong DB thành các Class Java (Entity). Thay vì viết SQL thủ công, bạn thao tác với đối tượng Java và ORM (Hibernate) tự sinh SQL. |
| **CORS** | Cross-Origin Resource Sharing | Cơ chế bảo mật trình duyệt. Cho phép FE (chạy ở domain A) gọi API BE (ở domain B). Cần cấu hình ở Spring Boot để FE không bị chặn. |
| **XSS** | Cross-Site Scripting | Kiểu tấn công web: kẻ xấu chèn mã JavaScript độc hại vào trang web. Dùng HttpOnly Cookie và sanitize HTML để chống. |
| **OCR** | Optical Character Recognition | Nhận diện ký tự quang học — công nghệ đọc chữ từ ảnh chụp. Javi dùng Google Vision API để đọc chữ tiếng Nhật từ ảnh. |
| **TTS** | Text-to-Speech | Chuyển văn bản thành giọng nói. Javi dùng Google Cloud TTS để tạo file âm thanh phát âm chuẩn tiếng Nhật. |
| **STT** | Speech-to-Text | Chuyển giọng nói thành văn bản. Gemini 2.5-flash hỗ trợ trực tiếp tính năng này (Multimodal Audio Input). |
| **RAG** | Retrieval-Augmented Generation | Kỹ thuật "neo" AI vào dữ liệu thực: Trước khi hỏi AI, ta truy vấn DB lấy thông tin chính xác → Nạp vào làm ngữ cảnh (context) cho AI → AI chỉ được phép giải thích dựa trên dữ liệu đó, không được tự bịa. |
| **LLM** | Large Language Model | Mô hình ngôn ngữ lớn (như GPT, Gemini, Claude). Được huấn luyện trên hàng tỷ câu văn để hiểu và sinh ngôn ngữ tự nhiên. |
| **SRS** | Spaced Repetition System | Hệ thống lặp lại ngắt quãng — phương pháp học thuộc thông minh. Thẻ khó sẽ được ôn thường xuyên hơn, thẻ dễ sẽ được giãn dần khoảng cách ôn. |
| **SM-2** | SuperMemo Algorithm 2 | Thuật toán cụ thể để tính khoảng cách ôn tập trong SRS. Dựa trên chất lượng trả lời (Again/Hard/Good/Easy) để quyết định bao nhiêu ngày sau cần ôn lại. |
| **PWA** | Progressive Web App | Ứng dụng web tiến bộ — công nghệ biến website thành app cài được trên điện thoại. User bấm "Thêm vào màn hình chính" mà không cần qua App Store. Hỗ trợ offline, push notification. |
| **MVP** | Minimum Viable Product | Sản phẩm khả dụng tối thiểu — phiên bản đầu tiên chỉ có tính năng cốt lõi nhất để ra mắt nhanh, thu thập feedback từ người dùng thật, rồi cải tiến dần. |
| **QA** | Quality Assurance | Đảm bảo chất lượng — quy trình kiểm tra và sửa lỗi trước khi sản phẩm đến tay người dùng. |
| **UX/UI** | User Experience / User Interface | Trải nghiệm người dùng (cảm giác khi dùng app) / Giao diện người dùng (hình ảnh, bố cục, màu sắc). |

---

## 2. CÔNG NGHỆ FRONTEND CHI TIẾT

### React (v18.3)
*   **Là gì:** Thư viện JavaScript do Meta (Facebook) phát triển để xây dựng giao diện người dùng dạng component-based (chia nhỏ giao diện thành các khối tái sử dụng).
*   **Dùng ở đâu trong Javi:** Toàn bộ giao diện — mỗi trang (LoginPage, SearchHome, TranslatePage,...) là một React component.

### TypeScript
*   **Là gì:** Phiên bản nâng cấp của JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh (type safety). Giúp phát hiện lỗi ngay lúc viết code thay vì lúc chạy app.
*   **Dùng ở đâu:** Toàn bộ code FE đều viết bằng TypeScript (file `.tsx`, `.ts`).

### Vite (v5.4)
*   **Là gì:** Công cụ build (bundler) thế hệ mới cho web app. Nhanh hơn Webpack rất nhiều nhờ sử dụng ES Modules native.
*   **Dùng ở đâu:** Thay thế Create React App (CRA) truyền thống. Khi bạn chạy `npm run dev`, Vite khởi động dev server trong <1 giây.

### Ant Design (v5.27) & Pro Components
*   **Là gì:** Thư viện UI components cao cấp từ Alibaba. Cung cấp sẵn hàng trăm component: Button, Table, Form, Modal, DatePicker, Upload,...
*   **Pro Components:** Bộ mở rộng của Ant Design chuyên cho trang Admin Dashboard (ProTable với filter/sort/pagination tự động).
*   **Dùng ở đâu:** Toàn bộ giao diện Admin (bảng quản lý Users, Vocabulary, Kanji, Grammar) và các form tìm kiếm.

### Zustand (v5.0)
*   **Là gì:** Thư viện quản lý state (trạng thái toàn cục) cho React. Nhẹ hơn Redux rất nhiều, code ngắn gọn, dễ hiểu.
*   **Dùng ở đâu:** `useAuthStore` (lưu token + thông tin user đăng nhập), `useGlobalErrorStore` (trạng thái server down).

### Tailwind CSS (v3.4)
*   **Là gì:** Framework CSS tiện ích (utility-first). Thay vì viết CSS riêng, bạn gắn class trực tiếp vào HTML: `class="bg-blue-500 text-white rounded-lg p-4"`.
*   **Dùng ở đâu:** Styling toàn bộ giao diện FE.

### react-force-graph-2d
*   **Là gì:** Thư viện vẽ đồ thị mạng lưới (network graph) 2D dạng mô phỏng lực hấp dẫn (force-directed). Các node tự động phân bố vị trí hợp lý.
*   **Dùng ở đâu:** Trực quan hoá cấu trúc phân tách Hán tự. Ví dụ: Kanji 「例」→ con là 「亻」+ 「列」→ cháu là 「刂」+「歹」.

### wanakana (v5.3)
*   **Là gì:** Thư viện JavaScript chuyên xử lý ký tự tiếng Nhật. Tự động chuyển đổi Romaji ↔ Hiragana ↔ Katakana khi người dùng gõ bàn phím.
*   **Dùng ở đâu:** Thanh tìm kiếm — khi user gõ "taberu" → tự động hiển thị "たべる".

### react-easy-crop *(MỚI)*
*   **Là gì:** Thư viện React cho phép cắt/crop ảnh trực tiếp trên trình duyệt bằng cách kéo và zoom.
*   **Dùng ở đâu:** Trước khi gửi ảnh lên API OCR để dịch, user crop vùng chứa chữ tiếng Nhật → Tăng độ chính xác OCR.

### MediaRecorder API *(MỚI)*
*   **Là gì:** API mặc định có sẵn trong trình duyệt (Chrome, Firefox, Safari) để thu âm giọng nói qua microphone. Không cần cài thêm thư viện nào.
*   **Dùng ở đâu:** Tính năng Speaking Ladder — thu âm giọng đọc của user để gửi lên BE chấm điểm phát âm.

### IndexedDB / idb *(MỚI)*
*   **Là gì:** Cơ sở dữ liệu nhúng ngay trong trình duyệt (client-side storage). Lưu được dung lượng lớn (hàng trăm MB), nhanh hơn LocalStorage.
*   **Dùng ở đâu:** Cache kết quả tra cứu từ vựng và file audio TTS trên trình duyệt → Lần sau tra lại hiển thị tức thì mà không cần gọi API.

### vite-plugin-pwa *(MỚI)*
*   **Là gì:** Plugin Vite giúp tự động sinh Service Worker và Web App Manifest, biến website thành PWA.
*   **Dùng ở đâu:** Cho phép user "cài" Javi lên điện thoại như một app thực thụ, hỗ trợ offline caching.

### framer-motion
*   **Là gì:** Thư viện animation mạnh mẽ nhất cho React. Tạo các hiệu ứng chuyển động mượt mà: fade, slide, scale, drag, layout animation.
*   **Dùng ở đâu:** Hiệu ứng chuyển trang, flip card Flashcard, hiệu ứng hover các component.

### canvas-confetti
*   **Là gì:** Thư viện tạo hiệu ứng pháo hoa/pháo giấy (confetti) trên canvas.
*   **Dùng ở đâu:** Hiệu ứng chúc mừng khi thanh toán Premium thành công hoặc khi hoàn thành bài luyện nói.

---

## 3. CÔNG NGHỆ BACKEND CHI TIẾT

### Spring Boot (v3.5) + Java 21
*   **Là gì:** Framework Java phổ biến nhất thế giới để xây dựng ứng dụng web phía server. Spring Boot là phiên bản "tự động cấu hình" giúp khởi tạo project cực nhanh.
*   **Java 21:** Phiên bản LTS (Long-Term Support) mới nhất của ngôn ngữ Java, hỗ trợ Virtual Threads, Pattern Matching, Text Blocks.

### Spring Data JPA + Hibernate
*   **Spring Data JPA:** Tầng trừu tượng giúp thao tác DB bằng cách khai báo interface (Repository). Ví dụ: `findByUsername(String username)` → Hibernate tự sinh SQL `SELECT * FROM users WHERE username = ?`.
*   **Hibernate:** ORM engine — ánh xạ Entity Java thành bảng MySQL. Cấu hình `ddl-auto: update` sẽ tự động tạo/cập nhật bảng khi bạn thêm field mới vào Entity.

### MySQL
*   **Là gì:** Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở phổ biến nhất. Dữ liệu được tổ chức thành bảng (table) có hàng (row) và cột (column).
*   **Dùng ở đâu:** Lưu trữ toàn bộ dữ liệu: users, từ vựng, Kanji, ngữ pháp, comments, translations, flashcards,...

### Redis
*   **Là gì:** Cơ sở dữ liệu key-value lưu trữ trong bộ nhớ RAM (in-memory). Tốc độ đọc/ghi cực nhanh (< 1ms).
*   **Dùng ở đâu:** Cache kết quả tra cứu phổ biến (giảm tải MySQL), Rate Limiting (đếm số lượt gọi API của mỗi user), lưu Refresh Token.

### Spring Security + OAuth2 Resource Server
*   **Spring Security:** Framework bảo mật cho Spring Boot. Kiểm soát ai được phép truy cập endpoint nào.
*   **OAuth2 Resource Server:** Cấu hình BE hoạt động như "Resource Server" — tự động giải mã và xác thực JWT token trong mỗi HTTP request.

### nimbus-jose-jwt
*   **Là gì:** Thư viện Java để tạo (sign) và xác thực (verify) JWT token. Hỗ trợ các thuật toán mã hoá mạnh (HMAC, RSA, EC).
*   **Dùng ở đâu:** TokenService — tạo Access Token (15 phút) và Refresh Token (14 ngày).

### Spring AI OpenAI (v1.0.3)
*   **Là gì:** Module chính thức của Spring để tích hợp các mô hình AI. Mặc dù tên là "OpenAI", nó hỗ trợ trỏ sang bất kỳ endpoint tương thích nào.
*   **Dùng ở đâu:** Cấu hình `base-url: https://generativelanguage.googleapis.com` → Gọi trực tiếp **Gemini 2.5-flash** của Google thay vì GPT.

### Gemini 2.5-flash
*   **Là gì:** Mô hình AI đa phương thức (Multimodal) mới nhất của Google DeepMind. Hỗ trợ đầu vào: Văn bản, Hình ảnh, Âm thanh, Video. Tốc độ phản hồi nhanh, chi phí thấp.
*   **Dùng ở đâu:** Dịch thuật AI, giải thích từ vựng, kiểm tra ngữ pháp, phân tích Hán tự, chấm điểm phát âm (Audio input), hội thoại Kaiwa.

### spring-filter (Turkraft, v3.1.9)
*   **Là gì:** Thư viện cho phép FE gửi biểu thức lọc phức tạp trong URL, Backend tự động chuyển thành JPA query. Không cần viết SQL thủ công.
*   **Ví dụ:** `GET /vocabularies?filter=level:'N3' and topics.code:'TRAVEL'` → Tự động sinh `WHERE level = 'N3' AND topic.code = 'TRAVEL'`.

### MapStruct (v1.6.3)
*   **Là gì:** Thư viện tự động ánh xạ (mapping) giữa Entity và DTO. Thay vì viết `dto.setName(entity.getName())` thủ công hàng chục dòng, MapStruct tự sinh code mapping lúc compile.
*   **Dùng ở đâu:** Chuyển đổi Entity ↔ Request DTO ↔ Response DTO trong tất cả các Service.

### Lombok
*   **Là gì:** Thư viện giúp giảm boilerplate code Java. Thêm annotation `@Getter`, `@Setter`, `@Builder`, `@RequiredArgsConstructor` → Lombok tự sinh getter/setter/constructor lúc compile.
*   **Dùng ở đâu:** Tất cả Entity và DTO trong dự án.

### Lingua (v1.2.2)
*   **Là gì:** Thư viện Java phát hiện ngôn ngữ tự động. Nhận vào một đoạn text → Trả về ngôn ngữ (Japanese, Vietnamese, English,...) với độ chính xác cao.
*   **Dùng ở đâu:** Tự động phát hiện ngôn ngữ đầu vào khi user dịch thuật, để chọn đúng hướng dịch (JP→VI hay VI→JP).

### Jsoup
*   **Là gì:** Thư viện Java xử lý HTML/XML. Hỗ trợ sanitize (lọc sạch) nội dung HTML để chống tấn công XSS.
*   **Dùng ở đâu:** Lọc nội dung comment của user trước khi lưu vào DB.

### Thumbnailator
*   **Là gì:** Thư viện Java resize và nén ảnh đơn giản. Hỗ trợ crop, scale, watermark.
*   **Dùng ở đâu:** Nén ảnh avatar user trước khi upload lên Cloudflare R2 để tiết kiệm dung lượng.

### Bucket4j *(MỚI)*
*   **Là gì:** Thư viện Java implement thuật toán Token Bucket để giới hạn tốc độ gọi API (Rate Limiting).
*   **Dùng ở đâu:** Giới hạn số lượt gọi API AI cho tài khoản FREE (ví dụ: 10 lượt dịch AI/ngày, 3 lượt dịch ảnh/ngày).

---

## 4. DỊCH VỤ BÊN THỨ BA (THIRD-PARTY SERVICES)

### Google Cloud Vision API
*   **Là gì:** Dịch vụ AI của Google Cloud chuyên phân tích hình ảnh. Tính năng TEXT_DETECTION đọc và trích xuất chữ từ ảnh (OCR).
*   **Dùng ở đâu:** Đọc chữ tiếng Nhật từ ảnh chụp (sách, bảng hiệu, manga) → Gửi kết quả cho Gemini dịch.

### Google Cloud Text-to-Speech *(MỚI)*
*   **Là gì:** Dịch vụ chuyển văn bản thành giọng nói AI tự nhiên. Hỗ trợ giọng đọc Nhật chuẩn Tokyo (ja-JP-Neural2-C).
*   **Dùng ở đâu:** Tạo file phát âm chuẩn cho câu mẫu luyện nói và câu đáp của AI trong Speaking Ladder.

### Cloudflare R2
*   **Là gì:** Dịch vụ lưu trữ file đám mây (object storage) của Cloudflare, tương thích API Amazon S3 nhưng không tính phí egress (download).
*   **Dùng ở đâu:** Lưu ảnh avatar user, GIF viết Kanji, file audio TTS.

### PayOS / SePay / Casso *(MỚI)*
*   **Là gì:** Các cổng thanh toán Việt Nam hỗ trợ tạo mã QR VietQR động và gửi Webhook callback khi có biến động số dư.
*   **Dùng ở đâu:** Tự động hoá quy trình nâng cấp Premium. User quét QR chuyển khoản → Hệ thống nhận Webhook → Tự động kích hoạt Premium trong 3 giây.

### JMdict (Dữ liệu mã nguồn mở)
*   **Là gì:** Bộ từ điển Nhật-Anh mã nguồn mở lớn nhất thế giới, được cộng đồng kiểm duyệt suốt 20+ năm. Chứa 200,000+ mục từ với nghĩa, cách đọc, loại từ chi tiết.
*   **Dùng ở đâu:** Nguồn dữ liệu seed để import từ vựng vào MySQL.

### KanjiVG (Dữ liệu mã nguồn mở)
*   **Là gì:** Bộ dữ liệu SVG chứa thứ tự nét viết (stroke order) của tất cả Kanji phổ biến. Mỗi Kanji là một file SVG vector chất lượng cao.
*   **Dùng ở đâu:** SVG Stroke-Order Player — thay thế GIF tĩnh bằng animation vector sắc nét có thể Play/Pause/Slow Motion.

---

## 5. THUẬT NGỮ KIẾN TRÚC & DESIGN PATTERN

| Thuật ngữ | Giải thích |
|---|---|
| **Multimodal AI** | AI có khả năng xử lý nhiều loại dữ liệu đầu vào cùng lúc: văn bản, hình ảnh, âm thanh, video. Gemini 2.5-flash là mô hình Multimodal. |
| **Prompt Engineering** | Kỹ thuật thiết kế câu lệnh (prompt) gửi cho AI để nhận được kết quả chính xác và có cấu trúc mong muốn. |
| **Single-Flight Prompt** | Kỹ thuật gộp nhiều tác vụ vào 1 lần gọi API AI duy nhất để tiết kiệm chi phí và giảm độ trễ. Ví dụ: 1 prompt yêu cầu Gemini vừa STT vừa chấm điểm vừa trả lời câu tiếp theo. |
| **Temperature** | Tham số điều chỉnh độ sáng tạo của AI. Temperature = 0 → AI luôn trả lời giống nhau (deterministic). Temperature = 1 → AI sáng tạo hơn nhưng dễ bịa. Javi dùng 0.1 để đảm bảo chính xác học thuật. |
| **AI Hallucination** | Hiện tượng AI tự tin trả về thông tin sai lệch hoặc bịa đặt mà không hề cảnh báo. Đây là vấn đề lớn nhất khi ứng dụng AI vào giáo dục. |
| **Human-in-the-Loop** | Mô hình có con người tham gia vào vòng lặp kiểm duyệt AI. AI xử lý tự động → Con người kiểm tra và sửa kết quả → AI học từ bản sửa. |
| **Guardrails** | Rào chắn kỹ thuật giới hạn hành vi của AI. Ví dụ: Temperature thấp, Schema JSON cứng, Confidence Score threshold. |
| **Bootstrapping** | Chiến lược khởi nghiệp tự lực cánh sinh — vận hành dự án với nguồn lực tối thiểu, không cần vốn đầu tư hay thuê nhân sự đắt đỏ ở giai đoạn đầu. |
| **Pay-per-Ticket** | Mô hình trả công theo hiệu suất. Không trả lương cứng mà trả tiền cho mỗi ticket/task được hoàn thành. |
| **Webhook** | Cơ chế "gọi ngược" — Khi một sự kiện xảy ra (ví dụ: nhận tiền vào tài khoản ngân hàng), hệ thống bên thứ ba tự động gửi HTTP POST đến URL của bạn để thông báo. |
| **Service Worker** | Script JavaScript chạy ngầm trong trình duyệt, độc lập với trang web. Dùng để cache tài nguyên, hỗ trợ offline, nhận push notification. |
| **Seed Script** | Script chạy một lần để nạp dữ liệu ban đầu vào database (import từ điển, tạo tài khoản Admin mặc định, tạo Roles/Permissions mặc định). |

---

## 6. THUẬT NGỮ TIẾNG NHẬT TRONG DỰ ÁN

| Thuật ngữ | Romaji | Giải thích |
|---|---|---|
| **JLPT** | — | Japanese Language Proficiency Test — Kỳ thi năng lực tiếng Nhật quốc tế. 5 cấp độ từ N5 (dễ nhất) đến N1 (khó nhất). |
| **Kanji** | 漢字 | Chữ Hán (ký tự gốc Trung Quốc) dùng trong tiếng Nhật. Ví dụ: 山 (Núi), 食 (Ăn). |
| **Hiragana** | ひらがな | Bảng chữ cái tiếng Nhật cơ bản (46 ký tự). Dùng cho từ thuần Nhật. Ví dụ: たべる (taberu = ăn). |
| **Katakana** | カタカナ | Bảng chữ cái tiếng Nhật thứ hai (46 ký tự). Dùng cho từ ngoại lai. Ví dụ: コーヒー (kōhī = coffee). |
| **Romaji** | ローマ字 | Phiên âm tiếng Nhật bằng chữ cái Latin (a-z). Ví dụ: taberu, kōhī. |
| **Furigana** | 振り仮名 | Chữ Hiragana nhỏ viết phía trên Kanji để hướng dẫn cách đọc. Ví dụ: 食（た）べる. |
| **Onyomi** | 音読み | Cách đọc Kanji theo âm Hán (gốc Trung Quốc). Ví dụ: 食 đọc là ショク (shoku). |
| **Kunyomi** | 訓読み | Cách đọc Kanji theo âm thuần Nhật. Ví dụ: 食 đọc là た.べる (ta.beru). |
| **Kaiwa** | 会話 | Hội thoại — bài luyện giao tiếp tiếng Nhật. |
| **Shadowing** | シャドーイング | Phương pháp luyện nói bằng cách nghe và đọc theo ngay lập tức (bắt chước giọng nói mẫu). |
| **Sino-Vietnamese** | Hán Việt | Cách đọc Kanji theo phiên âm tiếng Việt. Ví dụ: 食 = "Thực". |
| **Baito** | バイト | Từ viết tắt của アルバイト (arubaito), nghĩa là làm thêm/part-time job. |
