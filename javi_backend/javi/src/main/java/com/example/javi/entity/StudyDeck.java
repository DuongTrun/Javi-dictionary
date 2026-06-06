/**
 * File này: Entity StudyDeck.
 * Vai trò: Đại diện cho sổ tay học tập (bộ sưu tập flashcard) của người dùng (ví dụ: "Từ vựng N3", "Từ vựng chuyên ngành").
 * Dùng khi: Hibernate đồng bộ ánh xạ bảng 'study_decks' dưới database.
 */
package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "study_decks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudyDeck extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deck_id")
    Long id;

    @Column(name = "name", nullable = false)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    Users user;
}
