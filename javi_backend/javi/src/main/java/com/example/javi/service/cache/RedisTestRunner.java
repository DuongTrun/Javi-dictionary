package com.example.javi.service.cache;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

// @Component
@RequiredArgsConstructor
public class RedisTestRunner implements CommandLineRunner {
    private final StringRedisTemplate redisTemplate;

    @Override
    public void run(String... args) {
        redisTemplate.opsForValue().set("hello", "world");
        String value = redisTemplate.opsForValue().get("hello");
        System.out.println("Redis test OK: " + value);
    }
}
