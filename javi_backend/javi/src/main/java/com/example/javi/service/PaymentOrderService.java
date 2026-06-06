package com.example.javi.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.javi.dto.request.PaymentOrderRequest;
import com.example.javi.dto.response.PaymentOrderResponse;
import com.example.javi.entity.PaymentOrder;

public interface PaymentOrderService {

    /** User tạo đơn thanh toán */
    PaymentOrderResponse createOrder(PaymentOrderRequest request);

    /** User xem đơn của mình */
    List<PaymentOrderResponse> getMyOrders();

    /** Admin xem tất cả đơn (phân trang + filter) */
    Page<PaymentOrderResponse> getAllOrders(Specification<PaymentOrder> spec, Pageable pageable);

    /** Admin duyệt đơn */
    PaymentOrderResponse approveOrder(Long orderId);

    /** Admin từ chối đơn */
    PaymentOrderResponse rejectOrder(Long orderId, String adminNote);
}
