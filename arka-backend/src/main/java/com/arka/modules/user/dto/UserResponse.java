package com.arka.modules.user.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    BigDecimal creditBalance
) {
}

