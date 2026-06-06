/**
 * File này: Controller TopicController.
 * Vai trò: Tiếp nhận các HTTP Request từ Frontend gửi đến đường dẫn /api/v1/demo-topics, gọi sang Service xử lý và trả về kết quả JSON.
 * Dùng khi: Frontend gọi API để lấy danh sách hoặc tạo mới một chủ đề từ vựng.
 */
package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.TopicRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.TopicResponse;
import com.example.javi.service.TopicService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/topics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TopicController {
    TopicService topicService;

    @GetMapping("")
    public ApiResponse<List<TopicResponse>> getAllTopics() {
        log.info("API: GET /api/v1/topics - Lấy toàn bộ chủ đề");
        List<TopicResponse> topics = topicService.getAllTopics();
        return ApiResponse.<List<TopicResponse>>builder()
                .code(1000)
                .message("Lấy danh sách chủ đề thành công")
                .result(topics)
                .build();
    }

    @PostMapping("")
    public ApiResponse<TopicResponse> createTopic(@Valid @RequestBody TopicRequest request) {
        log.info("API: POST /api/v1/topics - Tạo chủ đề mới: {}", request.getNameVi());
        TopicResponse topic = topicService.createTopic(request);
        return ApiResponse.<TopicResponse>builder()
                .code(1000)
                .message("Tạo chủ đề thành công")
                .result(topic)
                .build();
    }
}
