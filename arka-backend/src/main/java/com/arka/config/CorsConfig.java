package com.arka.config;

import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

  @Value("${FRONTEND_URLS:${FRONTEND_URL:http://localhost:5173,http://localhost:3000}}")
  private String frontendUrls;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    List<String> allowedOrigins = Stream.of(frontendUrls.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isBlank())
        .distinct()
        .toList();

    if (allowedOrigins.isEmpty()) {
      throw new IllegalStateException("Set FRONTEND_URLS (or FRONTEND_URL) to enable CORS safely");
    }

    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}









