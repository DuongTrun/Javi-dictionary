/**
 * File này: DTO StudyDeckRequest.
 * Vai trò: Chứa dữ liệu gửi từ Frontend khi tạo mới một Sổ tay học tập (StudyDeck).
 * Dùng khi: Controller tiếp nhận request body tạo sổ tay.
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
public class StudyDeckRequest {
    @NotBlank(message = "Tên sổ tay không được để trống")
    String name;

    String description;
}
