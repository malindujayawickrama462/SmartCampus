package com.example.smart_campus.repository;

import com.example.smart_campus.model.UserSession;
import com.example.smart_campus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findBySessionToken(String sessionToken);
    List<UserSession> findByUserAndActiveTrue(User user);
    List<UserSession> findByUser(User user);
    void deleteByLogoutTimeNotNullAndLogoutTimeBefore(LocalDateTime cutoffTime);
    Integer countByUserAndActiveTrue(User user);
}
