package com.example.smart_campus.repository;

import com.example.smart_campus.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUser_IdAndReadFalse(Long userId);
    long countByUser_IdAndReadFalse(Long userId);
}
