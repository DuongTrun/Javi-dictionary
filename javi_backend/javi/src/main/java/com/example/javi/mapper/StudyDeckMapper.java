/**
 * File này: Mapper StudyDeckMapper.
 * Vai trò: Sử dụng MapStruct để sinh code tự động chuyển đổi giữa StudyDeck (Entity) và StudyDeckRequest, StudyDeckResponse (DTOs).
 * Dùng khi: Service chuyển đổi dữ liệu để thực hiện nghiệp vụ.
 */
package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.javi.dto.request.StudyDeckRequest;
import com.example.javi.dto.response.StudyDeckResponse;
import com.example.javi.entity.StudyDeck;

@Mapper(componentModel = "spring")
public interface StudyDeckMapper {
    StudyDeck toStudyDeck(StudyDeckRequest request);

    @Mapping(source = "user.id", target = "userId")
    StudyDeckResponse toResponse(StudyDeck entity);
}
