package com.example.javi.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.javi.entity.*;
import com.example.javi.repository.PermissionRepository;
import com.example.javi.repository.RoleRepository;
import com.example.javi.repository.TopicRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.repository.VocabulariesRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@org.springframework.stereotype.Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DatabaseInitializer implements ApplicationRunner {
    PasswordEncoder passwordEncoder;
    UsersRepository usersRepository;
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    TopicRepository topicRepository;
    VocabulariesRepository vocabulariesRepository;
    JdbcTemplate jdbcTemplate;
    com.example.javi.service.cache.VocabulariesCacheService vocabulariesCacheService;

    static final String ADMIN_USER_NAME = "admin";
    static final String ADMIN_PASSWORD = "123456";
    static final String ADMIN_EMAIL = "admin@gmail.com";
    static final String USER_USER_NAME = "user";
    static final String USER_PASSWORD = "123456";
    static final String USER_EMAIL = "user@gmail.com";

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(ApplicationArguments args) {
        try {
            vocabulariesCacheService.clearAllCache();
            log.info("[BOOT CACHE CLEAR] Cleared all Redis caches on application startup.");
        } catch (Exception e) {
            log.error("[BOOT CACHE CLEAR ERROR] Failed to clear Redis cache: " + e.getMessage());
        }

        if (permissionRepository.count() == 0) {
            ArrayList<Permission> arr = new ArrayList<>();
            arr.add(new Permission("CREATE_GRAMMAR", "Cho phép tạo mẫu ngữ pháp mới.", true));
            arr.add(new Permission("UPDATE_GRAMMAR", "Cho phép cập nhật mẫu ngữ pháp", true));
            arr.add(new Permission("DELETE_GRAMMAR", "Cho phép xóa mẫu ngữ pháp", true));
            arr.add(new Permission("CREATE_VOCABULARY", "Cho phép tạo từ vựng mới", true));
            arr.add(new Permission("UPDATE_VOCABULARY", "Cho phép cập nhật từ vựng", true));
            arr.add(new Permission("DELETE_VOCABULARY", "Cho phép xóa từ vựng", true));
            arr.add(new Permission("CREATE_KANJI", "Cho phép tạo kanji mới", true));
            arr.add(new Permission("UPDATE_KANJI", "Cho phép cập nhật mẫu kanji", true));
            arr.add(new Permission("DELETE_KANJI", "Cho phép xóa kanji", true));
            arr.add(new Permission("CREATE_COMMENT", "Cho phép bình luận", true));
            arr.add(new Permission("UPDATE_COMMENT", "Cho phép cập nhật bình luận", true));
            arr.add(new Permission("DELETE_COMMENT", "Cho phép xóa bình luận", true));
            arr.add(new Permission("MANAGE_USER_COMMENT", "Cho phép xóa bình luận của người dùng", true));
            arr.add(new Permission("BLOCK_USER", "Cho phép chặn người dùng", true));
            arr.add(new Permission(
                    "MANAGE_USER", "Cho phép quản lý tạo, cập nhật người dùng (không cập nhật role)", true));
            arr.add(new Permission("CREATE_USER", "Cho phép tạo người dùng và gán role", true));
            arr.add(new Permission("MANAGE_PERMISSION", "Cho phép quản lý permission", true));
            arr.add(new Permission("MANAGE_ROLE", "Cho phép quản lý role", true));
            permissionRepository.saveAll(arr);
        }

        if (roleRepository.findByName("ADMIN").isEmpty()) {
            List<Permission> allPermissions = permissionRepository.findAll();
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Admin có toàn quyền hệ thống");
            adminRole.setSystemRole(true);
            adminRole.setPermissions(allPermissions);
            roleRepository.save(adminRole);
        }

        if (roleRepository.findByName("USER").isEmpty()) {
            List<Permission> userPermissions = permissionRepository.findAll().stream()
                    .filter(p -> p.getName().equals("CREATE_COMMENT")
                            || p.getName().equals("UPDATE_COMMENT")
                            || p.getName().equals("DELETE_COMMENT"))
                    .toList();

            Role userRole = new Role();
            userRole.setName("USER");
            userRole.setDescription("Người dùng cơ bản");
            userRole.setSystemRole(true);
            userRole.setPermissions(userPermissions);
            roleRepository.save(userRole);
        }

        if (usersRepository.findByUsername(ADMIN_USER_NAME).isEmpty()) {
            Role adminRole = roleRepository.findByName("ADMIN").get();
            Users adminUser = new Users();
            adminUser.setUsername(ADMIN_USER_NAME);
            adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            adminUser.setEmail(ADMIN_EMAIL);
            adminUser.setStatus(Status.ACTIVE);
            adminUser.setRole(adminRole);
            adminUser.setAccountType(AccountType.PREMIUM);
            adminUser.setRemainingTrialExplains(5);
            adminUser.setVerified(true);
            usersRepository.save(adminUser);
        }

        if (usersRepository.findByUsername(USER_USER_NAME).isEmpty()) {
            Role userRole =
                    roleRepository.findByName(USER_USER_NAME.toUpperCase()).get();
            Users user = new Users();
            user.setUsername(USER_USER_NAME);
            user.setPassword(passwordEncoder.encode(USER_PASSWORD));
            user.setEmail(USER_EMAIL);
            user.setStatus(Status.ACTIVE);
            user.setRole(userRole);
            user.setAccountType(AccountType.FREE);
            user.setRemainingTrialExplains(5);
            user.setVerified(true);
            usersRepository.save(user);
        }

        // Reset topics if we have topics but 0 mapped vocabularies (likely encoding mismatch on previous run)
        if (topicRepository.count() > 0) {
            Integer relationCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vocabulary_topic", Integer.class);
            if (relationCount != null && relationCount == 0) {
                log.warn("[TOPIC SEED] Detected 0 mappings in vocabulary_topic. Clearing topics to trigger re-seeding with correct UTF-8 strings...");
                jdbcTemplate.execute("DELETE FROM vocabulary_topic");
                jdbcTemplate.execute("DELETE FROM topics");
            }
        }

        if (topicRepository.count() == 0) {
            log.info("[TOPIC SEED] Bắt đầu khởi tạo dữ liệu chủ đề mẫu...");

            Topic travel = Topic.builder().nameVi("Du lịch").nameJa("旅行").description("Từ vựng phục vụ mục đích du lịch, hỏi đường, khách sạn, sân bay...").build();
            Topic business = Topic.builder().nameVi("Công sở").nameJa("ビジネス").description("Từ vựng dùng trong công việc, giao tiếp với đồng nghiệp, đối tác...").build();
            Topic school = Topic.builder().nameVi("Trường học").nameJa("学校").description("Từ vựng liên quan đến học tập, trường lớp, thi cử, bạn bè...").build();
            Topic dining = Topic.builder().nameVi("Ăn uống").nameJa("飲食").description("Từ vựng về các món ăn, nhà hàng, đồ uống, gọi món...").build();
            Topic conversation = Topic.builder().nameVi("Giao tiếp hàng ngày").nameJa("日常会話").description("Từ vựng thông dụng trong giao tiếp sinh hoạt đời sống hàng ngày...").build();

            travel = topicRepository.save(travel);
            business = topicRepository.save(business);
            school = topicRepository.save(school);
            dining = topicRepository.save(dining);
            conversation = topicRepository.save(conversation);

            // Gán từ vựng mẫu
            seedVocabsForTopic(travel, List.of("旅行", "ホテル", "切符", "飛行機", "パスポート", "観光", "駅", "空港", "旅館", "お土産", "温泉", "案内", "地図", "出発"));
            seedVocabsForTopic(business, List.of("会社", "会議", "仕事", "電話", "出張", "社長", "残業", "給料", "書類", "名刺", "契約", "同僚", "報告", "連絡", "相談"));
            seedVocabsForTopic(school, List.of("学校", "先生", "学生", "勉強", "教室", "宿題", "試験", "授業", "教科書", "友達", "卒業", "入学", "質問", "作文", "黒板"));
            seedVocabsForTopic(dining, List.of("料理", "ご飯", "水", "お茶", "肉", "魚", "野菜", "果物", "美味しい", "注文", "食堂", "朝ご飯", "晩ご飯", "昼ご飯", "酒"));
            seedVocabsForTopic(conversation, List.of("日常", "会話", "挨拶", "友達", "家族", "掃除", "洗濯", "買い物", "映画", "音楽", "遊ぶ", "散歩", "携帯", "家", "趣味"));

            log.info("[TOPIC SEED] Khởi tạo dữ liệu chủ đề mẫu thành công!");
        }
    }

    private void seedVocabsForTopic(Topic topic, List<String> words) {
        for (String word : words) {
            List<Vocabularies> vocabs = vocabulariesRepository.findAllByWord(word);
            for (Vocabularies vocab : vocabs) {
                if (vocab.getTopics() == null) {
                    vocab.setTopics(new ArrayList<>());
                }
                if (!vocab.getTopics().contains(topic)) {
                    vocab.getTopics().add(topic);
                    vocabulariesRepository.save(vocab);
                }
            }
        }
    }
}
