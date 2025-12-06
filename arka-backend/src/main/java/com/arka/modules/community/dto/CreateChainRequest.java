package com.arka.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChainRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    String title,
    
    @NotBlank(message = "Book ID is required")
    String bookId,
    
    String description
) {}



