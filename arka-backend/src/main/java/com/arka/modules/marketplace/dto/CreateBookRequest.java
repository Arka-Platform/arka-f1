package com.arka.modules.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CreateBookRequest(
    @NotBlank String title,
    @NotBlank String author,
    String description,
    @NotNull @PositiveOrZero BigDecimal price
) {}

