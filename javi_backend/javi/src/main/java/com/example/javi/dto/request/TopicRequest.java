/**
 * File này: DTO TopicRequest.
 * Vai trò: Chứa dữ liệu đầu vào gửi lên từ Frontend khi người dùng muốn thêm mới một chủ đề (Topic).
 * Dùng khi: Controller nhận dữ liệu trong Request Body.
 */
package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopicRequest {
    @NotBlank(message = "Tên tiếng Việt không được để trống")
    String nameVi;

    @NotBlank(message = "Tên tiếng Nhật không được để trống")
    String nameJa;

    String description;
}
