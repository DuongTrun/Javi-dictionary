/**
 * File này: Entity Topic.
 * Vai trò: Đại diện cho bảng 'topics' lưu trữ các chủ đề học tiếng Nhật (ví dụ: Giao tiếp, Du lịch, JLPT...).
 * Dùng khi: Hibernate tự động ánh xạ class này thành bảng dưới database MySQL.
 */
package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Topic extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "topic_id")
    Long id;

    @Column(name = "name_vi", nullable = false)
    String nameVi;

    @Column(name = "name_ja", nullable = false)
    String nameJa;

    @Column(name = "description")
    String description;
}
