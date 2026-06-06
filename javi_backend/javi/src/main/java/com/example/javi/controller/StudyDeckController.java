/**
 * File này: Controller StudyDeckController.
 * Vai trò: Tiếp nhận các HTTP Request từ Frontend gửi đến đường dẫn /api/v1/study-decks, gọi sang Service xử lý và trả về kết quả JSON.
 * Dùng khi: Người dùng quản lý sổ tay ôn tập từ vựng của mình.
 */
package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.StudyDeckRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.StudyDeckResponse;
import com.example.javi.service.StudyDeckService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/study-decks")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("isAuthenticated()")
public class StudyDeckController {
    StudyDeckService studyDeckService;

    @GetMapping("")
    public ApiResponse<List<StudyDeckResponse>> getMyDecks() {
        log.info("API: GET /api/v1/study-decks - Lấy danh sách sổ tay của tôi");
        List<StudyDeckResponse> decks = studyDeckService.getDecksByCurrentUser();
        return ApiResponse.<List<StudyDeckResponse>>builder()
                .code(1000)
                .message("Lấy danh sách sổ tay thành công")
                .result(decks)
                .build();
    }

    @PostMapping("")
    public ApiResponse<StudyDeckResponse> createDeck(@Valid @RequestBody StudyDeckRequest request) {
        log.info("API: POST /api/v1/study-decks - Tạo sổ tay học tập mới: {}", request.getName());
        StudyDeckResponse deck = studyDeckService.createDeck(request);
        return ApiResponse.<StudyDeckResponse>builder()
                .code(1000)
                .message("Tạo sổ tay học tập thành công")
                .result(deck)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDeck(@PathVariable Long id) {
        log.info("API: DELETE /api/v1/study-decks/{} - Yêu cầu xóa sổ tay", id);
        studyDeckService.deleteDeck(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa sổ tay học tập thành công")
                .build();
    }
}
