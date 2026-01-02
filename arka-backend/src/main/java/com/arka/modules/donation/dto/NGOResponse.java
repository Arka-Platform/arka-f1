package com.arka.modules.donation.dto;

import java.util.List;
import java.util.UUID;

public record NGOResponse(
    UUID id,
    String name,
    String description,
    String location,
    Boolean verified,
    Integer booksReceived,
    List<String> categories,
    String contactEmail,
    String contactPhone,
    String website
) {}


