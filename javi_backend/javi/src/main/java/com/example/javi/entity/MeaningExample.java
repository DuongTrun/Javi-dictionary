package com.example.javi.entity;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
        name = "meaning_example",
        indexes = {
            @Index(name = "idx_example_mean_id", columnList = "mean_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MeaningExample extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;

    @Column(name = "ja_sentence", nullable = false, columnDefinition = "TEXT")
    String jaSentence; // câu ví dụ tiếng Nhật

    @Column(name = "vi_sentence", nullable = false, columnDefinition = "TEXT")
    String viSentence; // câu ví dụ tiếng Việt

    @ManyToOne
    @JoinColumn(name = "mean_id")
    @JsonBackReference
    private Meaning meaning;
}
