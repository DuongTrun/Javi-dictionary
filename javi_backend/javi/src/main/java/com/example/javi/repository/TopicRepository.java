/**
 * File này: Repository TopicRepository.
 * Vai trò: Cung cấp các hàm CRUD cơ bản (thêm, sửa, xóa, tìm kiếm) đối với thực thể Topic thông qua Spring Data JPA.
 * Dùng khi: Service cần truy xuất dữ liệu từ bảng 'topics' dưới MySQL.
 */
package com.example.javi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Topic;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long>, JpaSpecificationExecutor<Topic> {
}
