package com.arka.modules.demand.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MatchResponse(
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    String bookGenre,
    BigDecimal bookPrice,
    String bookImageUrl,
    UUID sellerId,
    String sellerName,
    double matchScore,
    List<String> matchReasons
) {}


