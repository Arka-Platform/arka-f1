package com.arka.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/**
 * Conditional OAuth2 Client Configuration
 * Only creates OAuth2 client beans when Google OAuth credentials are provided
 */
@Configuration
public class OAuth2ClientConfig {

  @Value("${app.oauth2.google.client-id:}")
  private String clientId;

  @Value("${app.oauth2.google.client-secret:}")
  private String clientSecret;

  @Value("${app.oauth2.google.redirect-uri:http://localhost:8080/login/oauth2/code/google}")
  private String redirectUri;

  @Bean
  @ConditionalOnExpression("!'${app.oauth2.google.client-id:}'.isEmpty()")
  public ClientRegistrationRepository clientRegistrationRepository() {
    // This bean is only created when client-id is set and not empty
    // Double-check that client-id is actually provided (safety check)
    if (clientId == null || clientId.trim().isEmpty()) {
      throw new IllegalStateException("OAuth2 client-id must be set when creating ClientRegistrationRepository");
    }

    ClientRegistration registration = ClientRegistration
        .withRegistrationId("google")
        .clientId(clientId)
        .clientSecret(clientSecret)
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri(redirectUri)
        .scope("email", "profile")
        .authorizationUri("https://accounts.google.com/o/oauth2/auth")
        .tokenUri("https://oauth2.googleapis.com/token")
        .userInfoUri("https://www.googleapis.com/oauth2/v2/userinfo")
        .userNameAttributeName("email")
        .build();

    return new InMemoryClientRegistrationRepository(registration);
  }
}

