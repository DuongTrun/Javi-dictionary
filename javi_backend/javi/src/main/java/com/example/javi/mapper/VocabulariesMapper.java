package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabResponse;
import com.example.javi.entity.Vocabularies;

@Mapper(componentModel = "spring", uses = {TopicMapper.class})
public interface VocabulariesMapper {
    @Mapping(target = "meanings", ignore = true)
    void toVocabularies(@MappingTarget Vocabularies vocab, VocabUpdateDTO vocabUpdateDTO);

    @Mapping(source = "vocabId", target = "id")
    VocabResponse toDto(Vocabularies vocab);
}
