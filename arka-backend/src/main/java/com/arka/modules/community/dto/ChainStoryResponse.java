package com.arka.modules.community.dto;

import java.util.List;

public record ChainStoryResponse(
    String id,
    String title,
    String chainBadge,
    String coverLabel,
    int streakDays,
    int hops,
    String lastHop,
    List<ChainParticipant> participants) {}














