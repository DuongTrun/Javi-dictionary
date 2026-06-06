package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.PublicUserResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.PremiumType;
import com.example.javi.entity.Users;

public interface UsersService {
    Page<UserResponse> getAllUsersByFilter(Specification<Users> spec, Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest user);

    UserResponse getMyInfo();

    PublicUserResponse getUserByUsername(String username);

    String updateAvatar(Long userId, String fileName);

    UserResponse changePassword(Long userId, ChangePassRequest changePassRequest);

    void blockUser(Long userId);

    void unblockUser(Long userId);

    String login(LoginRequest loginRequest);

    UserResponse updateUser(Long userId, UpdateUserRequest updateUserRequest);

    // Hàm thủ công, getMyInfo hiệu năng cao hơn
    Users getUserDetailsFromToken(String token);

    UserResponse setPremiumManually(Long userId, PremiumType premiumType);

    void checkAndUpdateImageQuota(Users users);

    void checkAndUpdateAiQuota(Users users);
}
