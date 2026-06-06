package com.example.javi.entity;

import java.util.List;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "meaning")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Meaning extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "vocab_id", nullable = false)
    @JsonBackReference
    Vocabularies vocabularies;

    @Column(nullable = false, columnDefinition = "TEXT")
    String meaningVn; // nghĩa tiếng việt

    @Column(columnDefinition = "TEXT")
    String description; // mô tả thêm cho nghĩa tiếng việt, (nếu có)

    @OneToMany(mappedBy = "meaning", cascade = CascadeType.ALL)
    @JsonManagedReference
    List<MeaningExample> examples;
}
