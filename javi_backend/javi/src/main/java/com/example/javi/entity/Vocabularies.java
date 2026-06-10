package com.example.javi.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
        name = "vocabularies",
        indexes = {
            @Index(name = "idx_vocab_word", columnList = "word"),
            @Index(name = "idx_vocab_hiragana", columnList = "hiragana"),
            @Index(name = "idx_vocab_romaji", columnList = "romaji")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vocabularies extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocab_id")
    Long vocabId;

    @Column(nullable = false)
    String word; // từ vựng cần tra

    String romaji; // cách đọc romaji
    String hiragana; // cách đọc hiragana
    String katakana; // cách đọc katakana

    @Enumerated(EnumType.STRING)
    @Column(name = "word_type")
    WordType wordType; // từ loại danh từ, tính từ...

    @Enumerated(EnumType.STRING)
    JlptLevel level;

    @ManyToMany
    @JoinTable(
            name = "vocabulary_kanji",
            joinColumns = @JoinColumn(name = "vocab_id"),
            inverseJoinColumns = @JoinColumn(name = "kanji_id"))
    //    @JsonIgnore
    private List<Kanji> kanjis;

    @ManyToMany
    @JoinTable(
            name = "vocabulary_topic",
            joinColumns = @JoinColumn(name = "vocab_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id"))
    private List<Topic> topics = new ArrayList<>();

    @OneToMany(mappedBy = "vocabularies", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    List<Meaning> meanings;
}
