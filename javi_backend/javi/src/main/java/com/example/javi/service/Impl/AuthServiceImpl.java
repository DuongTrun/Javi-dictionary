package com.example.javi.service.Impl;

import java.io.UnsupportedEncodingException;
import java.util.Optional;
import java.util.UUID;

import jakarta.mail.MessagingException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.RegisterRequest;
import com.example.javi.dto.response.GoogleTokenResponse;
import com.example.javi.dto.response.GoogleUserInfo;
import com.example.javi.dto.response.LoginResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.UsersMapper;
import com.example.javi.repository.RoleRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.service.AuthService;
import com.example.javi.service.GoogleService;
import com.example.javi.service.TokenService;
import com.example.javi.service.VerificationTokenService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthServiceImpl implements AuthService {
    AuthenticationManagerBuilder authenticationManagerBuilder;
    UsersRepository usersRepository;
    UsersMapper usersMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    VerificationTokenService verificationTokenService;
    SecurityUtil securityUtil;
    TokenService tokenService;
    GoogleService googleService;

    private boolean isMobileDevice(String userAgent) {
        // Kiểm tra User-Agent header để xác định thiết bị di động
        // đơn giản
        return userAgent.toLowerCase().contains("mobile");
    }

    private String generateUniqueUsername() {
        for (int i = 0; i < 5; i++) {
            // rút gọn UUID: 12 ký tự cho gọn URL
            String candidate =
                    "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            if (!usersRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.USERNAME_GENERATION_FAILED);
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) throws MessagingException, UnsupportedEncodingException {

        if (!ValidationUtils.isValidEmail(request.getEmail())) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }

        Optional<Users> existingUserOpt = usersRepository.findByEmail(request.getEmail());
        if (existingUserOpt.isPresent()) {
            throw new AppException(ErrorCode.EXIST_EMAIL);
        }

        Users newUser = new Users();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setVerified(true);

        // Gán role mặc định USER
        Role userRole = roleRepository.findByName("USER").orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        newUser.setRole(userRole);

        newUser.setUsername(generateUniqueUsername());

        usersRepository.save(newUser);

        return usersMapper.toCreateUserResponse(newUser);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String userAgent) {
        // Xác thực người dùng
        Authentication authentication;
        try {
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());
            authentication = authenticationManagerBuilder.getObject().authenticate(authToken);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new AppException(ErrorCode.INCORRECT_LOGIN_INFORMATION);
        }
        // set thông tin người dùng đăng nhập vào context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Lấy user từ DB
        Users user = usersRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus().equals(Status.BLOCKED)) {
            throw new AppException(ErrorCode.YOUR_ACCOUNT_HAS_BEEN_BLOCK);
        }
        // Kiểm tra email đã xác minh chưa. Nếu chưa thì hiện popup để người dùng nhấn chọn gửi lại email để xác thực
        if (!user.isVerified()) {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        UserResponse usersResponse = usersMapper.toUserResponse(user);
        // Sinh access token JWT
        String accessToken = securityUtil.generateToken(user);

        // Tạo refresh token và lưu vào DB, có truyền device type
        boolean isMobile = isMobileDevice(userAgent);
        Token jwtToken = tokenService.addToken(user, accessToken, isMobile);
        String tokenType = jwtToken.getTokenType();
        String refreshTokenValue = jwtToken.getRefreshToken();

        return new LoginResponse(accessToken, refreshTokenValue, tokenType, usersResponse);
    }

    @Override
    @Transactional
    public LoginResponse loginWithGoogle(String code, String userAgent) {
        GoogleTokenResponse tokenResponse = googleService.exchangeCodeForToken(code);
        String accessToken = tokenResponse.getAccessToken();

        // Lấy thông tin người dùng Google
        GoogleUserInfo info = googleService.getUserInfo(accessToken);

        if (info == null || info.getEmail() == null) {
            throw new AppException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        // Tìm hoặc liên kết tài khoản
        Optional<Users> existingGoogleUser = usersRepository.findByGoogleAccountId(info.getSub());
        Users user;

        if (existingGoogleUser.isPresent()) {
            user = existingGoogleUser.get(); // đã liên kết Google rồi
            if (user.getStatus() == Status.BLOCKED) {
                throw new AppException(ErrorCode.YOUR_ACCOUNT_HAS_BEEN_BLOCK);
            }
        } else {
            Optional<Users> byEmail = usersRepository.findByEmail(info.getEmail());
            if (byEmail.isPresent()) {
                // Liên kết tài khoản Google với user có sẵn (theo email)
                user = byEmail.get();
                user.setGoogleAccountId(info.getSub());
                user.setLoginProvider(AuthProvider.GOOGLE);
                user.setVerified(true);
                usersRepository.save(user);
            } else {
                Role role =
                        roleRepository.findByName("USER").orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                // Tạo tài khoản mới
                user = new Users();
                user.setEmail(info.getEmail());
                user.setFullName(info.getName());
                user.setUsername(generateUniqueUsername());
                user.setAvatarUrl(info.getPicture());
                user.setGoogleAccountId(info.getSub());
                user.setLoginProvider(AuthProvider.GOOGLE);
                user.setVerified(true);
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // random
                user.setRole(role);
                usersRepository.save(user);
            }
        }

        // Sinh access token JWT
        String userAccessToken = securityUtil.generateToken(user);

        // Tạo refresh token và lưu vào DB, có truyền device type
        boolean isMobile = isMobileDevice(userAgent);
        Token jwtToken = tokenService.addToken(user, userAccessToken, isMobile);
        String tokenType = jwtToken.getTokenType();
        String refreshTokenValue = jwtToken.getRefreshToken();

        return new LoginResponse(userAccessToken, refreshTokenValue, tokenType, usersMapper.toUserResponse(user));
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(String refreshToken) {

        // Kiểm tra refresh token có tồn tại không
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AppException(ErrorCode.TOKEN_CANNOT_EMPTY);
        }

        // Gọi logic gốc trong TokenService để xác thực và sinh token mới
        Token newToken = tokenService.refreshTokenUnified(refreshToken);

        Users user = newToken.getUser();
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        String accessToken = newToken.getToken();
        String NewRefreshToken = newToken.getRefreshToken();
        String tokenType = newToken.getTokenType();
        UserResponse userResponse = usersMapper.toUserResponse(user);

        return new LoginResponse(accessToken, NewRefreshToken, tokenType, userResponse);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            log.info("[LOGOUT] Không có refresh token trong cookie, bỏ qua revoke");
            return;
        }

        try {
            tokenService.revokeRefreshToken(refreshToken);
            log.info("[LOGOUT] Token {} đã bị revoke thành công", refreshToken);
        } catch (Exception e) {
            log.warn("[LOGOUT] Lỗi khi revoke refresh token: {}", e.getMessage());
            // vẫn cho phép tiếp tục logout, tránh crash API
        }
    }
}
