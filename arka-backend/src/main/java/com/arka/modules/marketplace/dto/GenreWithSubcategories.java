package com.arka.modules.marketplace.dto;

import java.util.List;

public record GenreWithSubcategories(
    String genre,
    List<String> subcategories
) {}




