package com.arka.modules.subscription.dto;

import java.util.UUID;

public record CreateSubscriptionRequest(
    UUID userId,
    String plan
) {}



