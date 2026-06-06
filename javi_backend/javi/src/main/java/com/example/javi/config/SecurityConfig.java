package com.example.javi.config;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import com.example.javi.entity.Token;
import com.example.javi.repository.TokenRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Value("${api.prefix}")
    private String apiPrefix;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint)
            throws Exception {

        String[] whiteList = {
            "/",
            "/auth/google",
            "/auth/google/callback",
            "oauth2/callback/google",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/users/register",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/**",
            "/api/v1/topics/**",
            "/api/v1/demo-data/**"
        };

        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authz -> authz.requestMatchers(whiteList)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, String.format("%s/vocab/**", apiPrefix))
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, String.format("%s/kanji/**", apiPrefix))
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, String.format("%s/grammar/**", apiPrefix))
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, String.format("%s/comments/**", apiPrefix))
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, String.format("%s/users/**", apiPrefix))
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/translate")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                                .authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("permission");
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    public JwtDecoder jwtDecoder(TokenRepository tokenRepository) {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(getSecretKey())
                .macAlgorithm(MacAlgorithm.HS512)
                .build();

        // Validator kiểm tra thời gian (exp/nbf)
        OAuth2TokenValidator<Jwt> expiryValidator = jwt -> {
            JwtTimestampValidator validator = new JwtTimestampValidator();
            OAuth2TokenValidatorResult result = validator.validate(jwt);
            if (result.hasErrors()) {
                return result; // Token hết hạn thì STOP
            }
            return OAuth2TokenValidatorResult.success();
        };

        // Validator kiểm tra DB (tồn tại + revoked)
        OAuth2TokenValidator<Jwt> databaseValidator = jwt -> {
            String tokenValue = jwt.getTokenValue();
            Token stored = tokenRepository.findByToken(tokenValue);
            if (stored == null) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Token không tồn tại trong hệ thống", null));
            }

            if (stored.isRevoked()) {
                return OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Token đã bị thu hồi (revoked)", null));
            }

            return OAuth2TokenValidatorResult.success();
        };

        // Chain validator theo thứ tự
        OAuth2TokenValidator<Jwt> validatorChain = jwt -> {
            OAuth2TokenValidatorResult ts = expiryValidator.validate(jwt);
            if (ts.hasErrors()) {
                return ts; // Token hết hạn thì không check DB
            }
            return databaseValidator.validate(jwt);
        };

        jwtDecoder.setJwtValidator(validatorChain);

        return jwtDecoder;
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(signerKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length, "HmacSHA512");
    }
}
