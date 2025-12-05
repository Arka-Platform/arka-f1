package com.arka.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Serve static files from classpath:/static
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requestedResource = location.createRelative(resourcePath);
            
            // If the requested resource doesn't exist, serve index.html for SPA routing
            if (requestedResource.exists() && requestedResource.isReadable()) {
              return requestedResource;
            }
            
            // For non-API paths, serve index.html
            if (!resourcePath.startsWith("api/") && !resourcePath.startsWith("actuator/")) {
              Resource indexResource = location.createRelative("index.html");
              if (indexResource.exists() && indexResource.isReadable()) {
                return indexResource;
              }
            }
            
            return null;
          }
        });
  }
}

