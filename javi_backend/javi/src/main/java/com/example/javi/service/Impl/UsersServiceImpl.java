package com.example.javi.service.Impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.PublicUserResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.UsersMapper;
import com.example.javi.repository.RoleRepository;
import com.example.javi.repository.TokenRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.util.Base64;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UsersServiceImpl implements UsersService {
    UsersRepository usersRepository;
    UsersMapper usersMapper;
    PasswordEncoder passwordEncoder;
    SecurityUtil securityUtil;
    RoleRepository roleRepository;
    TokenRepository tokenRepository;

    @NonFinal
    @Value("${app.time-zone}")
    private String timezone;

    @NonFinal
    @Value("${jwt.signerKey}")
    String signerKey;

    private ZoneId getZoneId() {
        return ZoneId.of(timezone);
    }

    @Override
    public Page<UserResponse> getAllUsersByFilter(Specification<Users> spec, Pageable pageable) {
        Page<Users> usersPage = usersRepository.findAll(spec, pageable);
        return usersPage.map(usersMapper::toUserResponse);
    }

    @Override
    public UserResponse getUserById(Long id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return usersMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // Chỉ người có quyền CREATE_USER mới được phép
        securityUtil.requirePermission("CREATE_USER");

        if (usersRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.EXIST_USERNAME);
        }

        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EXIST_EMAIL);
        }

        Users newUser = usersMapper.toUsers(request);
        Role role = (request.getRoleId() == null)
                ? roleRepository.findByName("USER").orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND))
                : roleRepository
                        .findById(request.getRoleId())
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        newUser.setRole(role);
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setVerified(true); // Admin đã tạo tức là đúng email không cần xác thực
        usersRepository.save(newUser);

        return usersMapper.toCreateUserResponse(newUser);
    }

    @Override
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        Users user = usersRepository.findByEmail(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return usersMapper.toUserResponse(user);
    }

    @Override
    public PublicUserResponse getUserByUsername(String username) {
        Optional<Users> userOptional = usersRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Users user = userOptional.get();
        if (user.getStatus().equals(Status.BLOCKED)) {
            throw new AppException(ErrorCode.USER_HAS_BEEN_BLOCK);
        }
        return usersMapper.toPublicUserResponse(user);
    }

    @Override
    @Transactional
    public String updateAvatar(Long userId, String fileName) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAvatarUrl(fileName);
        usersRepository.save(user);
        return fileName;
    }

    @Override
    @Transactional
    public UserResponse changePassword(Long userId, ChangePassRequest changePassRequest) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(changePassRequest.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        if (!changePassRequest.getNewPassword().equals(changePassRequest.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(changePassRequest.getNewPassword()));
        usersRepository.save(user);

        return usersMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public void blockUser(Long userId) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(Status.BLOCKED);
        usersRepository.save(user);
        // Revoke tất cả token và xóa token
        tokenRepository.revokeAllByUserId(userId);
    }

    @Override
    @Transactional
    public void unblockUser(Long userId) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(Status.ACTIVE);
        usersRepository.save(user);
    }

    @Override
    public String login(LoginRequest loginRequest) {
        String email = loginRequest.getEmail().trim();

        Users users = usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(loginRequest.getPassword(), users.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_LOGIN_INFORMATION);
        }

        if (users.getStatus().equals(Status.BLOCKED)) {
            throw new AppException(ErrorCode.YOUR_ACCOUNT_HAS_BEEN_BLOCK);
        }

        return (securityUtil.generateToken(users));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest updateUserRequest) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Users currentUser = securityUtil.getCurrentUser();

        boolean isSelf = currentUser.getId().equals(userId);
        boolean canManageUser = currentUser.getRole() != null
                && currentUser.getRole().getPermissions().stream()
                        .anyMatch(p -> p.getName().equalsIgnoreCase("MANAGE_USER"));
        boolean isAdmin =
                currentUser.getRole() != null && currentUser.getRole().getName().equalsIgnoreCase("ADMIN");

        // Nếu không phải bản thân hoặc người có MANAGE_USER → chặn
        if (!isSelf && !canManageUser && !isAdmin) {
            throw new AppException(ErrorCode.NO_PERMISSION_TO_UPDATE_USER);
        }

        // Validate username nếu có
        if (updateUserRequest.getUsername() != null) {
            String newUsername = updateUserRequest.getUsername().trim();
            if (newUsername.isEmpty()) {
                throw new AppException(ErrorCode.USERNAME_CANNOT_BLANK);
            }
            usersRepository
                    .findByUsername(newUsername)
                    .filter(u -> !u.getId().equals(userId))
                    .ifPresent(u -> {
                        throw new AppException(ErrorCode.EXIST_USERNAME);
                    });
            updateUserRequest.setUsername(newUsername);
        }

        // Chỉ ADMIN được phép đổi role
        if (updateUserRequest.getRoleId() != null) {
            if (!isAdmin) throw new AppException(ErrorCode.NO_PERMISSION_TO_UPDATE_ROLE);

            Role newRole = roleRepository
                    .findById(updateUserRequest.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(newRole);
        }

        // Update các field khác
        usersMapper.updateUserFromDto(updateUserRequest, user);
        usersRepository.save(user);

        return usersMapper.toUserResponse(user);
    }

    // Hàm thủ công, getMyInfo hiệu năng cao hơn
    @Override
    public Users getUserDetailsFromToken(String token) {
        if (securityUtil.isTokenExpired(token)) {
            throw new AppException(ErrorCode.TOKEN_HAS_EXPIRED);
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            byte[] keyBytes = Base64.from(signerKey).decode();
            MACVerifier verifier = new MACVerifier(keyBytes);

            if (!signedJWT.verify(verifier)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String email = signedJWT.getJWTClaimsSet().getSubject();

            return usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        } catch (Exception e) {
            log.error("Token verification failed: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    @Override
    @Transactional
    public UserResponse setPremiumManually(Long userId, PremiumType premiumType) {
        if (premiumType == null) {
            throw new AppException(ErrorCode.INVALID_PREMIUM_TYPE);
        }

        // Check quyền
        securityUtil.requirePermission("MANAGE_USER");

        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ZoneId zoneId = getZoneId();
        LocalDateTime now = LocalDateTime.now(zoneId);
        // nếu user đang còn premium (expiredAt != null và sau now) -> cộng dồn từ expiredAt,
        // ngược lại bắt đầu từ now (không cộng dồn).
        LocalDateTime baseTime = now;
        if (user.getAccountType() == AccountType.PREMIUM && user.getPremiumExpiredAt() != null) {
            LocalDateTime existingExpired = user.getPremiumExpiredAt();
            if (existingExpired.isAfter(now)) {
                // cộng dồn từ ngày hết hạn cũ
                baseTime = existingExpired;
            }
        }
        LocalDateTime expiredAt =
                switch (premiumType) {
                    case MONTHLY_1 -> baseTime.plusMonths(1);
                    case MONTHLY_3 -> baseTime.plusMonths(3);
                    case MONTHLY_6 -> baseTime.plusMonths(6);
                    case LIFETIME -> null;
                };

        user.setAccountType(AccountType.PREMIUM);
        user.setPremiumType(premiumType);
        user.setPremiumExpiredAt(expiredAt);
        usersRepository.save(user);

        return usersMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public synchronized void checkAndUpdateImageQuota(Users user) {
        ZoneId zoneId = getZoneId();
        LocalDate today = LocalDate.now(zoneId);

        // Hạ cấp nếu premium đã hết hạn
        if (user.getAccountType() == AccountType.PREMIUM
                && user.getPremiumExpiredAt() != null
                && user.getPremiumExpiredAt().isBefore(LocalDateTime.now(zoneId))) {
            log.info(
                    "[PREMIUM] User {} hết hạn lúc {}, tự động hạ cấp về FREE",
                    user.getEmail(),
                    user.getPremiumExpiredAt());
            user.setAccountType(AccountType.FREE);
            user.setPremiumExpiredAt(null);
            usersRepository.save(user);
        }

        // PREMIUM user còn hạn thì bỏ qua quota
        if (user.getAccountType() == AccountType.PREMIUM
                && (user.getPremiumExpiredAt() == null
                        || user.getPremiumExpiredAt().isAfter(LocalDateTime.now(zoneId)))) {
            log.debug("[QUOTA] PREMIUM user {} dịch ảnh, không trừ lượt", user.getEmail());
            return;
        }

        // Reset quota nếu sang ngày mới
        LocalDate lastDate = Optional.ofNullable(user.getLastImageTranslationDate())
                .map(LocalDateTime::toLocalDate)
                .orElse(null);

        if (lastDate == null || !lastDate.isEqual(today)) {
            log.info("[QUOTA] Reset lượt dịch ảnh cho user {} - Ngày mới {}", user.getEmail(), today);
            user.setDailyImageTranslations(2);
            user.setLastImageTranslationDate(LocalDateTime.now(zoneId));
            usersRepository.save(user);
        }

        // FREE user vượt quota
        if (user.getDailyImageTranslations() <= 0) {
            log.warn("[QUOTA] User {} đã vượt giới hạn 2 lượt dịch ảnh/ngày (FREE)", user.getEmail());
            throw new AppException(ErrorCode.FREE_USER_QUOTA_EXCEEDED);
        }

        // Trừ lượt cho FREE user
        user.setDailyImageTranslations(user.getDailyImageTranslations() - 1);
        user.setLastImageTranslationDate(LocalDateTime.now(zoneId));
        usersRepository.save(user);

        log.info(
                "[QUOTA] User {} (FREE) còn {}/2 lượt dịch ảnh hôm nay",
                user.getEmail(),
                user.getDailyImageTranslations());
     }

    @Override
    @Transactional
    public synchronized void checkAndUpdateAiQuota(Users user) {
        ZoneId zoneId = getZoneId();
        LocalDate today = LocalDate.now(zoneId);

        // Hạ cấp nếu premium đã hết hạn
        if (user.getAccountType() == AccountType.PREMIUM
                && user.getPremiumExpiredAt() != null
                && user.getPremiumExpiredAt().isBefore(LocalDateTime.now(zoneId))) {
            log.info(
                    "[PREMIUM] User {} hết hạn lúc {}, tự động hạ cấp về FREE",
                    user.getEmail(),
                    user.getPremiumExpiredAt());
            user.setAccountType(AccountType.FREE);
            user.setPremiumExpiredAt(null);
            usersRepository.save(user);
        }

        // PREMIUM user còn hạn thì bỏ qua quota
        if (user.getAccountType() == AccountType.PREMIUM
                && (user.getPremiumExpiredAt() == null
                        || user.getPremiumExpiredAt().isAfter(LocalDateTime.now(zoneId)))) {
            log.debug("[QUOTA] PREMIUM user {} sử dụng AI, không giới hạn", user.getEmail());
            return;
        }

        // Reset quota nếu sang ngày mới hoặc lần đầu tiên dùng AI
        LocalDate lastDate = Optional.ofNullable(user.getLastAiRequestDate())
                .map(LocalDateTime::toLocalDate)
                .orElse(null);

        if (lastDate == null || !lastDate.isEqual(today) || user.getDailyAiRequests() == null) {
            log.info("[QUOTA] Reset lượt sử dụng AI cho user {} - Ngày mới {}", user.getEmail(), today);
            user.setDailyAiRequests(5);
            user.setLastAiRequestDate(LocalDateTime.now(zoneId));
            usersRepository.save(user);
        }

        // FREE user vượt quota
        if (user.getDailyAiRequests() <= 0) {
            log.warn("[QUOTA] User {} đã vượt giới hạn 5 lượt sử dụng AI/ngày (FREE)", user.getEmail());
            throw new AppException(ErrorCode.DAILY_AI_LIMIT_EXCEEDED);
        }

        // Trừ lượt cho FREE user
        user.setDailyAiRequests(user.getDailyAiRequests() - 1);
        user.setLastAiRequestDate(LocalDateTime.now(zoneId));
        usersRepository.save(user);

        log.info(
                "[QUOTA] User {} (FREE) còn {}/5 lượt sử dụng AI hôm nay",
                user.getEmail(),
                user.getDailyAiRequests());
    }
}
