package com.example.smart_campus.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private Upload upload;
    private Jwt jwt;
    private Cors cors;

    @Data
    public static class Upload {
        private String dir;
    }

    @Data
    public static class Jwt {
        private String secret;
        private long expiration;
    }

    @Data
    public static class Cors {
        private String allowedOrigins;
    }
}
