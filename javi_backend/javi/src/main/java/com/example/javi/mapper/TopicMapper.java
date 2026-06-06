/**
 * File này: Mapper TopicMapper.
 * Vai trò: Sử dụng MapStruct để sinh code tự động chuyển đổi qua lại giữa Topic (Entity) và TopicRequest, TopicResponse (DTOs).
 * Dùng khi: Service chuyển đổi dữ liệu để thực hiện nghiệp vụ hoặc chuẩn bị trả về Controller.
 */
package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.javi.dto.request.TopicRequest;
import com.example.javi.dto.response.TopicResponse;
import com.example.javi.entity.Topic;

@Mapper(componentModel = "spring")
public interface TopicMapper {
    Topic toTopic(TopicRequest request);

    TopicResponse toResponse(Topic entity);

    @Mapping(target = "id", ignore = true)
    void updateTopic(TopicRequest request, @MappingTarget Topic topic);
}
