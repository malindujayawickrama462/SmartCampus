package com.example.smart_campus.repository;

import com.example.smart_campus.model.RefreshToken;
import com.example.smart_campus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUser(User user);
    List<RefreshToken> findByUserAndRevokedFalse(User user);
    void deleteByExpiryDateBefore(LocalDateTime now);
    void deleteByUser(User user);
}
