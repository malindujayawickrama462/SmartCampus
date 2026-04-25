package com.example.smart_campus.config;

import com.example.smart_campus.model.Role;
import com.example.smart_campus.model.User;
import com.example.smart_campus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Seed Admin
        if (!userRepository.existsByEmail("admin@smartcampus.com")) {
            User admin = User.builder()
                    .email("admin@smartcampus.com")
                    .name("Admin User")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .provider("local")
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Seeded ADMIN  → admin@smartcampus.com / Admin@123");
        }

        // Seed Technician
        if (!userRepository.existsByEmail("tech@smartcampus.com")) {
            User tech = User.builder()
                    .email("tech@smartcampus.com")
                    .name("Technician User")
                    .password(passwordEncoder.encode("Tech@123"))
                    .role(Role.TECHNICIAN)
                    .provider("local")
                    .build();
            userRepository.save(tech);
            System.out.println("✅ Seeded TECHNICIAN → tech@smartcampus.com / Tech@123");
        }

        // Seed Regular User
        if (!userRepository.existsByEmail("user@smartcampus.com")) {
            User user = User.builder()
                    .email("user@smartcampus.com")
                    .name("Regular User")
                    .password(passwordEncoder.encode("User@123"))
                    .role(Role.USER)
                    .provider("local")
                    .build();
            userRepository.save(user);
            System.out.println("✅ Seeded USER    → user@smartcampus.com / User@123");
        }
    }
}
