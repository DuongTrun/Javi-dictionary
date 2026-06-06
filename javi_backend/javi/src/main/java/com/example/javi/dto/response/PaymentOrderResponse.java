package com.example.javi.dto.response;

import java.time.LocalDate;

import com.example.javi.entity.PaymentStatus;
import com.example.javi.entity.PremiumType;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentOrderResponse {
    Long id;
    Long userId;
    String username;
    String email;
    PremiumType premiumType;
    Long amount;
    String transferContent;
    PaymentStatus status;
    String adminNote;
    LocalDate createdAt;
}
