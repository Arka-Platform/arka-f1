package com.arka.modules.marketplace.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateExchangeRequest(
    @NotNull UUID bookId
) {}












