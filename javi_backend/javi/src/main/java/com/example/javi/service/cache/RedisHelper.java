package com.example.javi.service.cache;

import java.time.Duration;
import java.util.Objects;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.PageWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisHelper {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // SAVE
    public <T> void save(String key, T data, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(key, json, ttl);
            log.info("[REDIS SAVE] key={} (TTL={}s)", key, ttl.toSeconds());
        } catch (Exception e) {
            log.error("[REDIS ERROR] Save key={} failed: {}", key, e.getMessage());
        }
    }

    // FIND (Đối tượng đơn)
    public <T> T find(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return null;
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.error("[REDIS ERROR] Deserialize key={} failed: {}", key, e.getMessage());
            return null;
        }
    }

    // FIND PAGE
    public <T> Page<T> findPage(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return null;

            PageWrapper<T> wrapper = objectMapper.readValue(
                    json, objectMapper.getTypeFactory().constructParametricType(PageWrapper.class, clazz));

            return new PageImpl<>(
                    wrapper.getContent(),
                    PageRequest.of(wrapper.getPageNumber(), wrapper.getPageSize()),
                    wrapper.getTotalElements());
        } catch (Exception e) {
            log.error("[REDIS ERROR] Deserialize page key={} failed: {}", key, e.getMessage());
            return null;
        }
    }

    // FIND LIST
    public <T> java.util.List<T> findList(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return null;

            return objectMapper.readValue(
                    json, objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, clazz));
        } catch (Exception e) {
            log.error("[REDIS ERROR] Deserialize list key={} failed: {}", key, e.getMessage());
            return null;
        }
    }

    // DELETE KEY
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.info("[REDIS DELETE] key={}", key);
        } catch (Exception e) {
            log.error("[REDIS ERROR] Delete key={} failed: {}", key, e.getMessage());
        }
    }

    // DELETE THEO PATTERN
    public void deleteByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("[REDIS CLEAR] {} keys by pattern '{}'", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.error("[REDIS ERROR] Clear pattern '{}' failed: {}", pattern, e.getMessage());
        }
    }

    // CLEAR ALL
    public void clearAll() {
        try {
            Objects.requireNonNull(redisTemplate.getConnectionFactory())
                    .getConnection()
                    .flushAll();
            log.warn("[REDIS FLUSH] Cleared all Redis data!");
        } catch (Exception e) {
            log.error("[REDIS ERROR] Clear all failed: {}", e.getMessage());
        }
    }
}
