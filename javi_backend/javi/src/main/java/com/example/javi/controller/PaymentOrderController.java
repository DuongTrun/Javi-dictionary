package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.PaymentOrderRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.PaymentOrderResponse;
import com.example.javi.entity.PaymentOrder;
import com.example.javi.service.PaymentOrderService;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("${api.prefix}/payment-orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentOrderController {

    PaymentOrderService paymentOrderService;

    /** User tạo đơn thanh toán sau khi chuyển khoản */
    @PostMapping("")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PaymentOrderResponse> createOrder(@Valid @RequestBody PaymentOrderRequest request) {
        return ApiResponse.<PaymentOrderResponse>builder()
                .message("Đã ghi nhận đơn thanh toán, vui lòng chờ admin xác nhận")
                .result(paymentOrderService.createOrder(request))
                .build();
    }

    /** User xem danh sách đơn của mình */
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<PaymentOrderResponse>> getMyOrders() {
        return ApiResponse.<List<PaymentOrderResponse>>builder()
                .message("Lấy danh sách đơn thanh toán thành công")
                .result(paymentOrderService.getMyOrders())
                .build();
    }

    /** Admin lấy tất cả đơn (có phân trang + filter) */
    @GetMapping("")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ApiResponse<Page<PaymentOrderResponse>> getAllOrders(
            @Filter Specification<PaymentOrder> spec,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<PaymentOrderResponse>>builder()
                .message("Lấy danh sách đơn thanh toán thành công")
                .result(paymentOrderService.getAllOrders(spec, pageable))
                .build();
    }

    /** Admin duyệt đơn */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ApiResponse<PaymentOrderResponse> approveOrder(@PathVariable Long id) {
        return ApiResponse.<PaymentOrderResponse>builder()
                .message("Đã duyệt đơn thanh toán và kích hoạt Premium thành công")
                .result(paymentOrderService.approveOrder(id))
                .build();
    }

    /** Admin từ chối đơn */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ApiResponse<PaymentOrderResponse> rejectOrder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String adminNote) {
        return ApiResponse.<PaymentOrderResponse>builder()
                .message("Đã từ chối đơn thanh toán")
                .result(paymentOrderService.rejectOrder(id, adminNote))
                .build();
    }
}
