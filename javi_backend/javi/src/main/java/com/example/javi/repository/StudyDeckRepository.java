/**
 * File này: Repository StudyDeckRepository.
 * Vai trò: Thực hiện các truy vấn dữ liệu thô liên quan đến bảng 'study_decks' dưới MySQL.
 * Dùng khi: Service muốn lấy danh sách sổ tay của một User cụ thể.
 */
package com.example.javi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.StudyDeck;

@Repository
public interface StudyDeckRepository extends JpaRepository<StudyDeck, Long>, JpaSpecificationExecutor<StudyDeck> {
    // Lấy danh sách sổ tay của một người dùng cụ thể
    List<StudyDeck> findByUserId(Long userId);
}
