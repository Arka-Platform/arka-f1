package com.arka.modules.recycling.service;

import com.arka.modules.recycling.dto.WastePaperResponse;
import com.arka.modules.recycling.mapper.WastePaperMapper;
import com.arka.modules.recycling.repository.WastePaperRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RecyclingService {
  private final WastePaperRepository repository;
  private final WastePaperMapper mapper;

  public RecyclingService(WastePaperRepository repository, WastePaperMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  public List<WastePaperResponse> listAll() {
    return repository.findAll()
        .stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public List<WastePaperResponse> search(String query) {
    return repository.search(query)
        .stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public List<WastePaperResponse> listByCategory(String category) {
    return repository.findByCategoryIgnoreCase(category)
        .stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }
}
