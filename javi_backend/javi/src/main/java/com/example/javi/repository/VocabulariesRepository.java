package com.example.javi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Vocabularies;

@Repository
public interface VocabulariesRepository
        extends JpaRepository<Vocabularies, Long>, JpaSpecificationExecutor<Vocabularies> {
    Optional<Vocabularies> findByWord(String word);

    Optional<Vocabularies> findFirstByWord(String word);

    List<Vocabularies> findAllByWord(String word);

    // Tìm kiếm từ chứa keyword (giới hạn 30 kết quả, ưu tiên từ ngắn)
    @Query(value = "SELECT v.* FROM vocabularies v "
            + "WHERE LOWER(v.word) LIKE CONCAT('%', LOWER(:keyword), '%') "
            + "ORDER BY CHAR_LENGTH(v.word) ASC "
            + "LIMIT 30",
            nativeQuery = true)
    List<Vocabularies> findByWordContaining(String keyword);

    // Tìm kiếm mờ trên word, hiragana, romaji (không join meaning - tránh full scan)
    @Query(value = "SELECT DISTINCT v.* FROM vocabularies v "
            + "WHERE "
            + "   v.word = :keyword OR "
            + "   v.hiragana = :keyword OR "
            + "   v.romaji = :keyword OR "
            + "   v.word LIKE CONCAT(:keyword, '%') OR "
            + "   v.hiragana LIKE CONCAT(:keyword, '%') OR "
            + "   v.romaji LIKE CONCAT(:keyword, '%') "
            + "ORDER BY "
            + "   CASE WHEN v.word = :keyword THEN 0 "
            + "        WHEN v.hiragana = :keyword OR v.romaji = :keyword THEN 1 "
            + "        WHEN v.word LIKE CONCAT(:keyword, '%') THEN 2 "
            + "        WHEN v.hiragana LIKE CONCAT(:keyword, '%') THEN 3 "
            + "        ELSE 4 END, "
            + "   CHAR_LENGTH(v.word) ASC "
            + "LIMIT 30",
            nativeQuery = true)
    List<Vocabularies> findFuzzySearch(String keyword);

    // Tìm theo nghĩa tiếng Việt bằng FULLTEXT (Inverted Index) — nhanh gấp 40-326x so với LIKE
    @Query(value = "SELECT DISTINCT v.* FROM vocabularies v "
            + "INNER JOIN meaning m ON v.vocab_id = m.vocab_id "
            + "WHERE MATCH(m.meaning_vn) AGAINST(:keyword IN BOOLEAN MODE) "
            + "ORDER BY CHAR_LENGTH(v.word) ASC "
            + "LIMIT 30",
            nativeQuery = true)
    List<Vocabularies> findByMeaningContaining(String keyword);
}
