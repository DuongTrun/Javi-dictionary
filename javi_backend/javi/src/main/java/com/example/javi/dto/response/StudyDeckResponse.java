/**
 * File này: DTO StudyDeckResponse.
 * Vai trò: Chứa dữ liệu phản hồi về Frontend hiển thị thông tin Sổ tay học tập (StudyDeck).
 * Dùng khi: Controller trả dữ liệu cho client.
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
public class StudyDeckResponse {
    Long id;
    String name;
    String description;
    Long userId;
    LocalDate createdAt;
    Integer reviewCount;
    Integer totalCards;
}
