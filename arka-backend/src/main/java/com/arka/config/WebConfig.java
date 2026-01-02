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
    // Serve uploaded files from local filesystem (for development)
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations("file:uploads/")
        .setCachePeriod(3600);
    
    // Serve static files from classpath:/static
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requestedResource = location.createRelative(resourcePath);
            
            // If the requested resource exists, serve it
            if (requestedResource.exists() && requestedResource.isReadable()) {
              return requestedResource;
            }
            
            // Don't serve index.html for API, actuator, or asset paths
            // Asset paths should return 404 if not found
            if (resourcePath.startsWith("api/") || 
                resourcePath.startsWith("actuator/") || 
                resourcePath.startsWith("assets/") ||
                resourcePath.startsWith("uploads/")) {
              return null; // Return 404 for missing assets/API endpoints/uploads
            }
            
            // For other paths (SPA routes), serve index.html
            Resource indexResource = location.createRelative("index.html");
            if (indexResource.exists() && indexResource.isReadable()) {
              return indexResource;
            }
            
            return null;
          }
        });
  }
}

