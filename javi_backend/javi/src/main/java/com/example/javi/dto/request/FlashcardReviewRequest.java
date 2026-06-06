/**
 * File này: DTO FlashcardReviewRequest.
 * Vai trò: Chứa dữ liệu đánh giá độ thuộc bài của người dùng gửi lên khi ôn tập xong một thẻ.
 * Dùng khi: Controller tiếp nhận request body gửi kết quả ôn tập.
 */
package com.example.javi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardReviewRequest {
    @NotNull(message = "ID của thẻ ghi nhớ không được để trống")
    Long cardId;

    @NotNull(message = "Đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 (Again)")
    @Max(value = 4, message = "Đánh giá tối đa là 4 (Easy)")
    int rating; // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
}
