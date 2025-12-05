package com.arka.modules.marketplace.mapper;

import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.entity.BookEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookMapper {
  @Mapping(source = "creditPrice", target = "price")
  @Mapping(source = "imageUrlMedium", target = "imageUrl")
  @Mapping(source = "imageUrlSmall", target = "thumbnailUrl")
  BookResponse toResponse(BookEntity entity);
}











