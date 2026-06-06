/**
 * File này: Triển khai TopicServiceImpl.
 * Vai trò: Thực thi logic nghiệp vụ cho Topic (Lấy toàn bộ chủ đề và Thêm chủ đề mới).
 * Dùng khi: Controller gọi xử lý nghiệp vụ đối với Topic.
 */
package com.example.javi.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.TopicRequest;
import com.example.javi.dto.response.TopicResponse;
import com.example.javi.entity.Topic;
import com.example.javi.mapper.TopicMapper;
import com.example.javi.repository.TopicRepository;
import com.example.javi.service.TopicService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TopicServiceImpl implements TopicService {
    TopicRepository topicRepository;
    TopicMapper topicMapper;

    @Override
    public List<TopicResponse> getAllTopics() {
        log.info("Lấy danh sách tất cả các chủ đề học tiếng Nhật");
        return topicRepository.findAll().stream()
                .map(topicMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TopicResponse createTopic(TopicRequest request) {
        log.info("Tạo mới một chủ đề: {} / {}", request.getNameJa(), request.getNameVi());
        Topic topic = topicMapper.toTopic(request);
        topic = topicRepository.save(topic);
        return topicMapper.toResponse(topic);
    }
}
