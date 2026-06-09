package com.example.javi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableRetry
public class JaviApplication {

    public static void main(String[] args) {
        SpringApplication.run(JaviApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.web.client.RestClientCustomizer restClientCustomizer() {
        return restClientBuilder -> {
            org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory = 
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(15000); // 15 seconds
            requestFactory.setReadTimeout(20000);    // 20 seconds
            restClientBuilder.requestFactory(requestFactory);
        };
    }
}
