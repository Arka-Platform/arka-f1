package com.arka.modules.community.dto;

import java.util.List;

public record CommunityCircleResponse(
    String id,
    String name,
    String description,
    String host,
    int members,
    int activeChains,
    int streakDays,
    List<String> tags,
    String badge) {}














