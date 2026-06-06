/**
 * File này: Triển khai StudyDeckServiceImpl.
 * Vai trò: Thực thi logic nghiệp vụ cho Sổ tay học tập (StudyDeck) như lấy danh sách, thêm và xóa sổ tay.
 * Dùng khi: Controller gọi xử lý nghiệp vụ đối với Sổ tay học tập.
 */
package com.example.javi.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.StudyDeckRequest;
import com.example.javi.dto.response.StudyDeckResponse;
import com.example.javi.entity.StudyDeck;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.StudyDeckMapper;
import com.example.javi.repository.FlashcardRepository;
import com.example.javi.repository.StudyDeckRepository;
import com.example.javi.service.StudyDeckService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudyDeckServiceImpl implements StudyDeckService {
    StudyDeckRepository studyDeckRepository;
    FlashcardRepository flashcardRepository;
    StudyDeckMapper studyDeckMapper;
    SecurityUtil securityUtil;

    @Override
    public List<StudyDeckResponse> getDecksByCurrentUser() {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Lấy danh sách sổ tay học tập của user: {}", currentUser.getEmail());
        
        return studyDeckRepository.findByUserId(currentUser.getId()).stream()
                .map(deck -> {
                    StudyDeckResponse response = studyDeckMapper.toResponse(deck);
                    long total = flashcardRepository.countByStudyDeckId(deck.getId());
                    long review = flashcardRepository.countByStudyDeckIdAndNextReviewDateLessThanEqual(deck.getId(), java.time.LocalDate.now());
                    response.setTotalCards((int) total);
                    response.setReviewCount((int) review);
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StudyDeckResponse createDeck(StudyDeckRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Tạo mới sổ tay học tập '{}' cho user: {}", request.getName(), currentUser.getEmail());

        StudyDeck deck = studyDeckMapper.toStudyDeck(request);
        deck.setUser(currentUser);
        deck = studyDeckRepository.save(deck);

        return studyDeckMapper.toResponse(deck);
    }

    @Override
    @Transactional
    public void deleteDeck(Long deckId) {
        Users currentUser = securityUtil.getCurrentUser();
        log.info("Yêu cầu xóa sổ tay học tập ID: {} bởi user: {}", deckId, currentUser.getEmail());

        StudyDeck deck = studyDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.DECK_NOT_FOUND));

        // Kiểm tra xem sổ tay có thuộc về người dùng hiện tại không
        if (!deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        studyDeckRepository.delete(deck);
        log.info("Xóa thành công sổ tay học tập ID: {}", deckId);
    }
}
