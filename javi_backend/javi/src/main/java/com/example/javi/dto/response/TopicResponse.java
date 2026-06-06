/**
 * File này: DTO TopicResponse.
 * Vai trò: Đóng gói thông tin chủ đề (Topic) trả về cho Frontend, ẩn bớt các thông tin không cần thiết của Entity.
 * Dùng khi: Controller trả dữ liệu về dạng JSON cho Frontend.
 */
package com.example.javi.dto.response;

import java.time.LocalDate;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopicResponse {
    Long id;
    String nameVi;
    String nameJa;
    String description;
    LocalDate createdAt;
    LocalDate updatedAt;
}
