package com.example.smart_campus.config;

import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.ResourceRepository;
import com.example.smart_campus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, 
                                     ResourceRepository resourceRepository,
                                     PasswordEncoder passwordEncoder) {
        return args -> {
            // Create default Admin if not exists
            if (!userRepository.existsByEmail("admin@smartcampus.com")) {
                User admin = new User();
                admin.setEmail("admin@smartcampus.com");
                admin.setName("System Admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ADMIN);
                admin.setProvider("local");
                userRepository.save(admin);
                System.out.println("Default admin user created: admin@smartcampus.com / admin123");
            }
            
            // Create default Technician if not exists
            if (!userRepository.existsByEmail("tech@smartcampus.com")) {
                User tech = new User();
                tech.setEmail("tech@smartcampus.com");
                tech.setName("Support Technician");
                tech.setPassword(passwordEncoder.encode("tech123"));
                tech.setRole(Role.TECHNICIAN);
                tech.setProvider("local");
                userRepository.save(tech);
                System.out.println("Default technician user created: tech@smartcampus.com / tech123");
            }

            // Seed sample Resources if table is empty
            if (resourceRepository.count() == 0) {
                resourceRepository.save(Resource.builder()
                        .name("Grand Auditorium")
                        .type(ResourceType.LECTURE_HALL)
                        .capacity(500)
                        .location("Main Building, Floor 1")
                        .description("Large hall for major lectures and events.")
                        .availableFrom(LocalTime.of(8, 0))
                        .availableTo(LocalTime.of(20, 0))
                        .status(ResourceStatus.ACTIVE)
                        .build());

                resourceRepository.save(Resource.builder()
                        .name("Advanced Robotics Lab")
                        .type(ResourceType.LAB)
                        .capacity(30)
                        .location("Science Block, Room 402")
                        .description("Equipped with high-end robotic arms and sensors.")
                        .availableFrom(LocalTime.of(9, 0))
                        .availableTo(LocalTime.of(18, 0))
                        .status(ResourceStatus.ACTIVE)
                        .build());

                resourceRepository.save(Resource.builder()
                        .name("Meeting Room A")
                        .type(ResourceType.MEETING_ROOM)
                        .capacity(12)
                        .location("Library, Floor 2")
                        .description("Quiet room for small group discussions.")
                        .availableFrom(LocalTime.of(8, 0))
                        .availableTo(LocalTime.of(22, 0))
                        .status(ResourceStatus.ACTIVE)
                        .build());

                System.out.println("Sample resources seeded.");
            }
        };
    }
}
