package com.example.javi.dto.request;

import com.example.javi.entity.PremiumType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentOrderRequest {

    @NotNull(message = "Loại gói Premium không được để trống")
    PremiumType premiumType;

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 1000, message = "Số tiền phải lớn hơn 1.000đ")
    Long amount;

    @NotBlank(message = "Nội dung chuyển khoản không được để trống")
    String transferContent;
}
