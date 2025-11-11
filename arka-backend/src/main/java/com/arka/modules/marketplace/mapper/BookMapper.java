package com.arka.modules.marketplace.mapper;

import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.entity.BookEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BookMapper {
  BookResponse toResponse(BookEntity entity);
}

