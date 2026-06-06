package com.example.javi.exeption;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // spotless:off
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Chưa đăng nhập hoặc token không hợp lệ (hết hạn, không đúng định dạng, hoặc không truyền JWT ở header)...", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền để dùng chức năng này", HttpStatus.FORBIDDEN),
    INVALID_PREMIUM_TYPE(1072, "Thời gian premium không hợp lệ hoặc không truyền xuống", HttpStatus.BAD_REQUEST),
    INVALID_MULTIPART_FILE(1093, "Request phải là multipart/form-data, key 'file' kiểu File", HttpStatus.BAD_REQUEST),
    INVALID_JSON_FROM_AI(1094, "Có lỗi khi phân tích, mời thử lại", HttpStatus.BAD_REQUEST),

    // USER
    USER_EXISTED(1002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    YOUR_ACCOUNT_HAS_BEEN_BLOCK(1043, "Tài khoản của bạn đã bị chặn, vui lòng liên hệ admin", HttpStatus.FORBIDDEN),
    USER_HAS_BEEN_BLOCK(1084, "Người dùng này đã bị chặn", HttpStatus.BAD_REQUEST),
    NO_PERMISSION_TO_UPDATE_USER(1055, "Bạn không có quyền cập nhật người dùng này", HttpStatus.FORBIDDEN),
    NO_TRIAL_LEFT(1071, "Bạn đã dùng hết lượt giải thích miễn phí. Hãy nâng cấp lên Premium để tiếp tục.", HttpStatus.FORBIDDEN),
    FREE_USER_QUOTA_EXCEEDED(1073, "Bạn đã dùng hết lượt dịch ảnh miễn phí hôm nay.", HttpStatus.FORBIDDEN),
    IMAGE_TOO_LARGE(1074, "Dung lượng ảnh không được quá 4MB", HttpStatus.BAD_REQUEST),
    IMAGE_GIF_TOO_LARGE(1092, "Dung lượng ảnh gif không được quá 10MB", HttpStatus.BAD_REQUEST),

    // LOGIN
    INCORRECT_LOGIN_INFORMATION(1006, "Đăng nhập thất bại. Email hoặc mật khẩu không đúng", HttpStatus.BAD_REQUEST),
    INVALID_GOOGLE_TOKEN(1090, "Token google không hợp lệ.", HttpStatus.BAD_REQUEST),

    // EMAIL
    EMAIL_CANNOT_BLANK(1009, "Email không được bỏ trống", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1012, "Email không hợp lệ, mời nhập lại", HttpStatus.BAD_REQUEST),
    EXIST_EMAIL(1013, "Email đã tồn tại, xin mời nhập email khác", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_VERIFIED(1014, "Email đã được xác thực", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_VERIFIED(1080, "Email từng đăng ký nhưng chưa xác minh. Chúng tôi đã gửi lại email xác thực cho bạn, vui lòng kiểm tra hòm thư?", HttpStatus.BAD_REQUEST),
    ERROR_SEND_EMAIL(1081, "Có lỗi xa ra khi gửi tin nhắn", HttpStatus.INTERNAL_SERVER_ERROR),

    // USERNAME
    USERNAME_CANNOT_BLANK(1010, "Tên người dùng không được bỏ trống", HttpStatus.BAD_REQUEST),
    EXIST_USERNAME(1014, "Tên người dùng đã tồn tại, mời nhập tên khác", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất 4 kí tự", HttpStatus.BAD_REQUEST),
    USERNAME_GENERATION_FAILED(1087, "Có lỗi trong quá trình tạo username", HttpStatus.BAD_REQUEST),

    // PASSWORD
    PASSWORD_CANNOT_BLANK(1011, "Mật khẩu không được bỏ trống", HttpStatus.BAD_REQUEST),
    MISMATCH_PASSWORD(1015, "Không trùng mật khẩu đã nhập ở trên, mời nhập lại", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất 6 kí tự", HttpStatus.BAD_REQUEST),
    INCORRECT_PASSWORD(1019, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),

    // FILE
    EMPTY_FILE(1016, "File rỗng, mời chọn file", HttpStatus.BAD_REQUEST),
    INVALID_FILE_NAME(1017, "Tên file ảnh không hợp lệ hoặc quá dài, hoặc quá ngắn, mời chọn file mới hoặc đổi tên", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(1018, "Loại file không phải file ảnh, vui lòng chọn file khác (PNG, JPG, JPEG)", HttpStatus.BAD_REQUEST),
    INVALID_FILE_GIFT(1018, "Vui lòng tải file ảnh gift", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1017, "File quá lớn, vui lòng chọn file khác", HttpStatus.BAD_REQUEST),

    // VOCAB
    EMPTY_WORD(1020, "Từ vựng rỗng, mời nhập từ vựng", HttpStatus.BAD_REQUEST),
    INVALID_WORD(1021, "Từ vựng không phải tiếng Nhật, mời nhập tiếng Nhật", HttpStatus.BAD_REQUEST),
    EXIST_WORD(1023, "Từ vựng đã tồn tại", HttpStatus.BAD_REQUEST),
    WORD_NOT_FOUND(1024, "Không tìm thấy từ vựng tương ứng", HttpStatus.NOT_FOUND),
    EMPTY_MEANING(1022, "Từ vựng đang không có nghĩa, mời nhập nghĩa", HttpStatus.BAD_REQUEST),
    TOO_MANY_REQUESTS(1094, "Bạn đang tạo nhiều yêu cầu trong một khoảng thời gian ngắn, vui lòng thử lại sau 5 giây", HttpStatus.BAD_REQUEST),

    // KANJI
    EMPTY_KANJI(1025, "Kanji không được để trống, mời nhập lại", HttpStatus.BAD_REQUEST),
    NOT_KANJI(1027, "Ký tự bạn nhập không phải Kanji, mời nhập lại", HttpStatus.BAD_REQUEST),
    NOT_SINGLE_KANJI(1064, "Bạn chỉ có thể xóa 1 kanji, không phải 1 cụm nhiều kanji", HttpStatus.BAD_REQUEST),
    KANJI_NOT_FOUND(1026, "Không có dữ liệu về chữ Kanji bạn cần tìm, mời nhập lại hán tự", HttpStatus.NOT_FOUND),
    KANJI_HAS_NO_MEANING(1027, "Kanji đang không có nghĩa", HttpStatus.BAD_REQUEST), // có dùng ở kanjiRequest mục valid
    KANJI_STILL_IN_USE(1028, "Không thể xóa Kanji. Kanji vẫn đang được sử dụng bởi từ vựng khác", HttpStatus.BAD_REQUEST),

    // GRAMMAR
    GRAMMAR_HAS_NO_ID(1040, "Id ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    EMPTY_GRAMMAR(1029, "Ngữ pháp cần tìm không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_PATTERN(1030, "Mẫu câu ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_MEANING(1031, "Nghĩa của ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_STRUCTURE(1032, "Cách chia ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_USAGE_NOTE(1033, "Phạm vi sử dụng ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_NOT_FOUND(1034, "Không có dữ liệu về ngữ pháp bạn vừa tìm, mời tìm lại", HttpStatus.NOT_FOUND),
    EXISTING_GRAMMAR_PATTERN(1035, "Ngữ pháp này đã tồn tại rồi", HttpStatus.BAD_REQUEST),

    // GRAMMAR_EXAMPLE
    GRAMMAR_EXAMPLE_HAS_NO_JA_SENTENCE(1036, "Ví dụ tiếng Nhật không được bỏ trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_HAS_NO_TRANSCRIPTION(1037, "Câu không có kanji không được bỏ trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_HAS_NO_VI_SENTENCE(1038, "Nghĩa tiếng Việt không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_NOT_FOUND(1039, "Không có dữ liệu về ví dụ này", HttpStatus.NOT_FOUND),

    // TOKEN
    TOKEN_GENERATION_FAILED(1041, "Không thể tạo token", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_NOT_FOUND(1042, "Không tìm thấy refresh token tương ứng", HttpStatus.NOT_FOUND),
    REFRESH_TOKEN_HAS_EXPIRED(1043, "Refresh token hết hạn", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_REVOKED(1045, "Refresh token bị thu hồi", HttpStatus.BAD_REQUEST),
    TOKEN_HAS_EXPIRED(1043, "Token đã hết hạn", HttpStatus.BAD_REQUEST),
    INVALID_TOKEN(1079, "Token không hợp lệ", HttpStatus.BAD_REQUEST),
    TOKEN_CANNOT_EMPTY(1080, "Token hoặc refresh token không được bỏ trống", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_REUSED(1991, "Refresh token đã bị thu hồi hoặc hết hạn", HttpStatus.BAD_REQUEST),

    // ROLE
    ROLE_HAS_NO_NAME(1046, "Tên của role không được để trống", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1047, "Không có dữ liệu về role cần tìm", HttpStatus.NOT_FOUND),
    ROLE_NAME_ALREADY_EXISTING(1048, "Tên role đã tồn tại", HttpStatus.BAD_REQUEST),
    SYSTEM_ROLE_CANNOT_DELETE(1052, "Không thể xóa role hệ thống", HttpStatus.BAD_REQUEST),
    SYSTEM_ROLE_CANNOT_RENAME(1053, "Role hệ thống, không thể đổi tên", HttpStatus.BAD_REQUEST),
    ROLE_IN_USE(1054, "Role đang được sử dụng bởi người dùng khác", HttpStatus.BAD_REQUEST),
    NO_PERMISSION_TO_UPDATE_ROLE(1083, "Bạn không có quyền để update role", HttpStatus.FORBIDDEN),
    ROLE_CANNOT_REMOVE_SYSTEM_PERMISSION_FROM_ADMIN(1095, "Không thể gỡ quyền hệ thống khỏi vai trò ADMIN", HttpStatus.BAD_REQUEST),

    // PERMISSION
    PERMISSION_HAS_NO_NAME(1049, "Tên của quyền không được để trống", HttpStatus.BAD_REQUEST),
    PERMISSION_NOT_FOUND(1050, "Không có dữ liệu về quyền cần tìm", HttpStatus.BAD_REQUEST),
    PERMISSION_NAME_ALREADY_EXISTING(1051, "Tên quyền đã tồn tại", HttpStatus.BAD_REQUEST),
    SYSTEM_PERMISSION_CANNOT_DELETE(1055, "Không thể xóa quyền hệ thống", HttpStatus.BAD_REQUEST),
    SYSTEM_PERMISSION_CANNOT_RENAME(1056, "Không thể đổi tên quyền hệ thống", HttpStatus.BAD_REQUEST),
    NO_PERMISSION_TO_CREATE_USER(1084, "Bạn không có quyền tạo người dùng", HttpStatus.FORBIDDEN),

    // COMMENT
    COMMENT_HAS_NO_ENTITY_TYPE(1057, "Không được để trống entityType", HttpStatus.BAD_REQUEST),
    COMMENT_HAS_NO_ENTITY_ID(1058, "Id của loại bình luận không được để trông", HttpStatus.BAD_REQUEST),
    COMMENT_HAS_NO_CONTENT(1059, "Bình luận phải có nội dung", HttpStatus.BAD_REQUEST),
    COMMENT_NOT_FOUND(1060, "Không tìm thấy comment tương ứng", HttpStatus.NOT_FOUND),
    NO_PERMISSION_TO_DELETE_COMMENT(1062, "Bạn không có quyền xóa bình luận này", HttpStatus.FORBIDDEN),
    NO_PERMISSION_TO_UPDATE_COMMENT(1081, "Bạn không có quyền cập nhật bình luận này", HttpStatus.FORBIDDEN),
    INVALID_REACTION(1063, "Phản ứng không đúng yêu cầu", HttpStatus.BAD_REQUEST),
    DUPLICATE_COMMENT(1082, "Bạn chỉ có thể bình luận 1 lần với mỗi một từ vựng, kanji, ngữ pháp cụ thể", HttpStatus.BAD_REQUEST),

    // TRANSLATION
    ERROR_TRANSLATION(1068, "Có lỗi xảy ra khi dịch", HttpStatus.BAD_REQUEST),
    SOURCE_LANG_CANNOT_EMPTY(1065, "Ngôn ngữ nguồn không được để trống", HttpStatus.BAD_REQUEST),
    TARGET_LANG_CANNOT_EMPTY(1066, "Ngôn ngữ đích không được để trống", HttpStatus.BAD_REQUEST),
    SOURCE_TEXT_CANNOT_EMPTY(1067, "Đoạn văn cần dịch không được để trống", HttpStatus.BAD_REQUEST),
    SOURCE_TEXT_TOO_LONG(1069, "Đoạn văn cần dịch không được quá 5000 từ", HttpStatus.BAD_REQUEST),
    CANNOT_DETECTED_TEXT_IN_IMAGE(1070, "Không thể phát hiện chữ trong ảnh của bạn", HttpStatus.BAD_REQUEST),
    REQUIRE_PREMIUM(1077, "Bạn cần nâng cấp tài khoản lên premium để thực hiện chức năng này", HttpStatus.FORBIDDEN),
    INVALID_ENGINE(1078, "Engin bạn truyền xuống không đúng", HttpStatus.BAD_REQUEST),

    // FLASHCARD & DECK
    DECK_NOT_FOUND(2001, "Không tìm thấy sổ tay học tập tương ứng", HttpStatus.NOT_FOUND),
    CARD_NOT_FOUND(2002, "Không tìm thấy thẻ ghi nhớ tương ứng", HttpStatus.NOT_FOUND),
    CARD_ALREADY_EXISTS(2003, "Thẻ này đã tồn tại trong sổ tay học tập", HttpStatus.BAD_REQUEST),

    // PAYMENT ORDER
    PAYMENT_ORDER_NOT_FOUND(4001, "Không tìm thấy đơn thanh toán tương ứng", HttpStatus.NOT_FOUND),
    PENDING_ORDER_EXISTS(4002, "Bạn đã có đơn thanh toán đang chờ xử lý, vui lòng đợi admin duyệt", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_PROCESSED(4003, "Đơn thanh toán này đã được xử lý rồi", HttpStatus.BAD_REQUEST),
    DAILY_AI_LIMIT_EXCEEDED(4004, "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng nâng cấp Premium!", HttpStatus.FORBIDDEN),

    // VOICE AI COACH
    AUDIO_FILE_REQUIRED(3001, "Tệp âm thanh không được để trống", HttpStatus.BAD_REQUEST),
    AUDIO_FILE_TOO_LARGE(3002, "Tệp âm thanh không được vượt quá 5MB", HttpStatus.BAD_REQUEST),
    VOICE_TARGET_TEXT_EMPTY(3003, "Văn bản mẫu không được để trống", HttpStatus.BAD_REQUEST),
    VOICE_PROCESSING_ERROR(3004, "Có lỗi xảy ra khi xử lý giọng nói, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),
    ;

    // spotless:on
    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
