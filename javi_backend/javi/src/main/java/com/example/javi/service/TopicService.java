/**
 * File này: Interface TopicService.
 * Vai trò: Khai báo các nghiệp vụ xử lý liên quan đến chủ đề (Topic).
 * Dùng khi: Controller muốn gọi xử lý nghiệp vụ đối với Topic.
 */
package com.example.javi.service;

import java.util.List;

import com.example.javi.dto.request.TopicRequest;
import com.example.javi.dto.response.TopicResponse;

public interface TopicService {
    List<TopicResponse> getAllTopics();
    TopicResponse createTopic(TopicRequest request);
}
