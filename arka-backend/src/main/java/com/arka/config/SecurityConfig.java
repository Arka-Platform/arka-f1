package com.arka.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final CorsConfig corsConfig;
  private final ClientRegistrationRepository clientRegistrationRepository;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  public SecurityConfig(
      CorsConfig corsConfig,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      @Autowired(required = false) ClientRegistrationRepository clientRegistrationRepository) {
    this.corsConfig = corsConfig;
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.clientRegistrationRepository = clientRegistrationRepository;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/actuator/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/books/**").permitAll()
            .requestMatchers("/api/v1/users/register", "/api/v1/users/login").permitAll()
            .requestMatchers("/api/v1/otp/**").permitAll()
            .requestMatchers("/api/v1/auth/**").permitAll()
            .requestMatchers("/api/admin/auth/**").permitAll()
            .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/**").authenticated()
            .anyRequest().authenticated()
        );

    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    // Conditionally enable OAuth2 login only if OAuth2 client is configured
    if (clientRegistrationRepository != null) {
      try {
        var registration = clientRegistrationRepository.findByRegistrationId("google");
        if (registration != null) {
          http.oauth2Login(oauth2 -> oauth2
              .defaultSuccessUrl("/api/v1/auth/oauth2/callback/google", true)
              .failureUrl("/auth/error")
          );
        }
      } catch (Exception e) {
        // OAuth2 not configured, continue without it
      }
    }

    return http.build();
  }
}

