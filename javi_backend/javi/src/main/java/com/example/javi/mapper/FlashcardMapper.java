/**
 * File này: Mapper FlashcardMapper.
 * Vai trò: Sử dụng MapStruct để tự động chuyển đổi từ Flashcard (Entity) sang FlashcardResponse (DTO).
 * Dùng khi: Service đóng gói thông tin chi tiết của thẻ ghi nhớ trả về cho Frontend.
 */
package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.javi.dto.response.FlashcardResponse;
import com.example.javi.entity.Flashcard;

@Mapper(componentModel = "spring", uses = {VocabulariesMapper.class, KanjiMapper.class, GrammarMapper.class})
public interface FlashcardMapper {
    @Mapping(source = "studyDeck.id", target = "deckId")
    @Mapping(source = "vocabulary", target = "vocab")
    FlashcardResponse toResponse(Flashcard entity);
}
