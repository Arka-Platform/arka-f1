package com.arka.modules.recycling.mapper;

import com.arka.modules.recycling.dto.WastePaperResponse;
import com.arka.modules.recycling.entity.WastePaperEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WastePaperMapper {
  WastePaperResponse toResponse(WastePaperEntity entity);
}
















