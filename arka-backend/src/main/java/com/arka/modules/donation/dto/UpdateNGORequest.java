package com.arka.modules.donation.dto;

import java.util.List;

public record UpdateNGORequest(
    String name,
    String description,
    String location,
    List<String> categories,
    String contactEmail,
    String contactPhone,
    String website,
    Boolean verified
) {}


