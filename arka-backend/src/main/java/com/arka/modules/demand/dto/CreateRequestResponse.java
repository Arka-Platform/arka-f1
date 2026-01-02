package com.arka.modules.demand.dto;

import java.util.List;

/**
 * Response DTO for request creation that includes the created request and immediate matches
 */
public record CreateRequestResponse(
    BookRequestResponse request,
    List<MatchResponse> matches,
    int totalMatches
) {}


