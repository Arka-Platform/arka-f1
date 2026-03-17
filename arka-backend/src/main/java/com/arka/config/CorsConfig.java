package com.arka.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@ConfigurationProperties(prefix = "app.cors")
public class CorsConfig {

  @Value("${FRONTEND_URL:http://localhost:5173}")
  private String frontendUrl;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    if (frontendUrl == null || frontendUrl.isBlank()) {
      throw new IllegalStateException("FRONTEND_URL must be set to enable CORS safely");
    }

    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(frontendUrl.trim()));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}









