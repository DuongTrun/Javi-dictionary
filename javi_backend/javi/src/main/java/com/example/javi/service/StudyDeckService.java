/**
 * File này: Interface StudyDeckService.
 * Vai trò: Khai báo các nghiệp vụ quản lý Sổ tay học tập (StudyDeck).
 * Dùng khi: Controller muốn gọi xử lý liên quan đến sổ tay.
 */
package com.example.javi.service;

import java.util.List;

import com.example.javi.dto.request.StudyDeckRequest;
import com.example.javi.dto.response.StudyDeckResponse;

public interface StudyDeckService {
    // Lấy toàn bộ danh sách sổ tay của người dùng hiện tại đang đăng nhập
    List<StudyDeckResponse> getDecksByCurrentUser();

    // Tạo mới một sổ tay học tập
    StudyDeckResponse createDeck(StudyDeckRequest request);

    // Xóa một sổ tay học tập theo ID
    void deleteDeck(Long deckId);
}
