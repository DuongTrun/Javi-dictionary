package com.example.javi.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Users extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String fullName;

    @Column(nullable = false, unique = true)
    String username;

    @Column(nullable = false, unique = true)
    String email;

    @Column(nullable = false)
    String password;

    @Column(name = "avatar_url")
    String avatarUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "self_introduction", columnDefinition = "TEXT")
    String selfIntroduction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType accountType = AccountType.FREE;

    @Column(name = "premium_expired_at")
    private LocalDateTime premiumExpiredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "premium_type")
    private PremiumType premiumType;

    @Column(name = "remaining_trial_explains")
    int remainingTrialExplains = 5;

    @Column(name = "daily_image_translations")
    private int dailyImageTranslations = 2;

    @Column(name = "last_image_translation_date")
    private LocalDateTime lastImageTranslationDate;

    @Column(name = "daily_ai_requests")
    private Integer dailyAiRequests = 5;

    @Column(name = "last_ai_request_date")
    private LocalDateTime lastAiRequestDate;

    @Column(nullable = false)
    private boolean verified = false;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @Enumerated(EnumType.STRING)
    Status status;

    @Enumerated(EnumType.STRING)
    JlptLevel level;

    @Column(unique = true, name = "google_account_id")
    private String googleAccountId;

    @Column(name = "login_provider")
    @Enumerated(EnumType.STRING)
    private AuthProvider loginProvider = AuthProvider.LOCAL;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    List<Comment> comments;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<HistorySearch> histories;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Translation> translations;
}
