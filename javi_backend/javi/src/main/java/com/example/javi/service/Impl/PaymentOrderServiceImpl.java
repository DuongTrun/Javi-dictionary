package com.example.javi.service.Impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.PaymentOrderRequest;
import com.example.javi.dto.response.PaymentOrderResponse;
import com.example.javi.entity.PaymentOrder;
import com.example.javi.entity.PaymentStatus;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.PaymentOrderRepository;
import com.example.javi.service.PaymentOrderService;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentOrderServiceImpl implements PaymentOrderService {

    PaymentOrderRepository paymentOrderRepository;
    SecurityUtil securityUtil;
    UsersService usersService;

    private PaymentOrderResponse toResponse(PaymentOrder order) {
        return PaymentOrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .username(order.getUser().getUsername())
                .email(order.getUser().getEmail())
                .premiumType(order.getPremiumType())
                .amount(order.getAmount())
                .transferContent(order.getTransferContent())
                .status(order.getStatus())
                .adminNote(order.getAdminNote())
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PaymentOrderResponse createOrder(PaymentOrderRequest request) {
        Users currentUser = securityUtil.getCurrentUser();

        // Kiểm tra xem user đã có đơn PENDING chưa
        List<PaymentOrder> pendingOrders =
                paymentOrderRepository.findByUserAndStatus(currentUser, PaymentStatus.PENDING);
        if (!pendingOrders.isEmpty()) {
            throw new AppException(ErrorCode.PENDING_ORDER_EXISTS);
        }

        PaymentOrder order = PaymentOrder.builder()
                .user(currentUser)
                .premiumType(request.getPremiumType())
                .amount(request.getAmount())
                .transferContent(request.getTransferContent())
                .status(PaymentStatus.PENDING)
                .build();

        paymentOrderRepository.save(order);
        log.info("[PAYMENT] User {} tạo đơn thanh toán #{} - {} - {}đ",
                currentUser.getEmail(), order.getId(), request.getPremiumType(), request.getAmount());

        return toResponse(order);
    }

    @Override
    public List<PaymentOrderResponse> getMyOrders() {
        Users currentUser = securityUtil.getCurrentUser();
        return paymentOrderRepository.findByUserOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<PaymentOrderResponse> getAllOrders(Specification<PaymentOrder> spec, Pageable pageable) {
        securityUtil.requirePermission("MANAGE_USER");
        return paymentOrderRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public PaymentOrderResponse approveOrder(Long orderId) {
        securityUtil.requirePermission("MANAGE_USER");

        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        if (order.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PROCESSED);
        }

        // Đổi status sang APPROVED
        order.setStatus(PaymentStatus.APPROVED);
        paymentOrderRepository.save(order);

        // Kích hoạt Premium cho user
        usersService.setPremiumManually(order.getUser().getId(), order.getPremiumType());

        log.info("[PAYMENT] Admin duyệt đơn #{} - User {} - Gói {}",
                orderId, order.getUser().getEmail(), order.getPremiumType());

        return toResponse(order);
    }

    @Override
    @Transactional
    public PaymentOrderResponse rejectOrder(Long orderId, String adminNote) {
        securityUtil.requirePermission("MANAGE_USER");

        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        if (order.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PROCESSED);
        }

        order.setStatus(PaymentStatus.REJECTED);
        order.setAdminNote(adminNote);
        paymentOrderRepository.save(order);

        log.info("[PAYMENT] Admin từ chối đơn #{} - User {} - Lý do: {}",
                orderId, order.getUser().getEmail(), adminNote);

        return toResponse(order);
    }
}
