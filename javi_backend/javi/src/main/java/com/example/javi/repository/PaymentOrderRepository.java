package com.example.javi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.PaymentOrder;
import com.example.javi.entity.PaymentStatus;
import com.example.javi.entity.Users;

@Repository
public interface PaymentOrderRepository
        extends JpaRepository<PaymentOrder, Long>, JpaSpecificationExecutor<PaymentOrder> {

    List<PaymentOrder> findByUserAndStatus(Users user, PaymentStatus status);

    List<PaymentOrder> findByUserOrderByCreatedAtDesc(Users user);
}
