package com.example.smart_campus.controller;

import com.example.smart_campus.model.User;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.model.RefreshToken;
import com.example.smart_campus.model.UserSession;
import com.example.smart_campus.repository.UserRepository;
import com.example.smart_campus.repository.RefreshTokenRepository;
import com.example.smart_campus.repository.UserSessionRepository;
import com.example.smart_campus.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSessionRepository userSessionRepository;

    @Value("${app.jwt.refresh.expiration:604800000}")
    private int refreshTokenExpirationMs;

    public AuthController(UserRepository userRepository, JwtUtils jwtUtils, PasswordEncoder passwordEncoder,
                          RefreshTokenRepository refreshTokenRepository, UserSessionRepository userSessionRepository) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userSessionRepository = userSessionRepository;
    }

    // GET /api/auth/me - Get current logged-in user info
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole(),
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
        ));
    }

    // POST /api/auth/register - register local user
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body,
                                                         HttpServletRequest request) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        if (email == null || password == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name, email, and password are required"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(409).body(Map.of("error", "Email already registered"));
        }

        User user = User.builder()
                .email(email)
                .name(name)
                .password(passwordEncoder.encode(password))
                .role(Role.USER)
                .provider("local")
                .build();

        userRepository.save(user);
        
        String accessToken = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        RefreshToken refreshToken = createRefreshToken(user);
        
        return ResponseEntity.status(201).body(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "expiresIn", 3600 // 1 hour
        ));
    }

    // POST /api/auth/login - login local user
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body,
                                                      HttpServletRequest request) {
        String email = body.get("email");
        String password = body.get("password");
        String deviceFingerprint = body.get("deviceFingerprint");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "email and password are required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        if (!"local".equals(user.getProvider())) {
            return ResponseEntity.status(403).body(Map.of("error", "Use OAuth login for this account"));
        }

        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        // Create session
        String sessionToken = UUID.randomUUID().toString();
        UserSession session = new UserSession(user, sessionToken, deviceFingerprint != null ? deviceFingerprint : "unknown");
        session.setIpAddress(getClientIpAddress(request));
        session.setUserAgent(request.getHeader("User-Agent"));
        userSessionRepository.save(session);

        String accessToken = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        RefreshToken refreshToken = createRefreshToken(user);
        
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "sessionId", sessionToken,
                "expiresIn", 3600
        ));
    }

    // POST /api/auth/refresh - Refresh access token
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, String> body) {
        String refreshTokenStr = body.get("refreshToken");
        
        if (refreshTokenStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "refreshToken is required"));
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr).orElse(null);
        
        if (refreshToken == null || !refreshToken.isValid()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired refresh token"));
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "expiresIn", 3600
        ));
    }

    // POST /api/auth/logout - Logout and invalidate tokens
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal User user,
                                                       @RequestBody(required = false) Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String sessionId = body != null ? body.get("sessionId") : null;
        if (sessionId != null) {
            UserSession session = userSessionRepository.findBySessionToken(sessionId).orElse(null);
            if (session != null && session.getUser().getId().equals(user.getId())) {
                session.setActive(false);
                session.setLogoutTime(LocalDateTime.now());
                userSessionRepository.save(session);
            }
        }

        // Revoke all refresh tokens for this user
        refreshTokenRepository.findByUserAndRevokedFalse(user).forEach(token -> {
            token.setRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
        });

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // GET /api/auth/login/google - Initiate Google OAuth2 (redirect handled by Spring)
    @GetMapping("/login/google")
    public ResponseEntity<Map<String, String>> googleLogin() {
        return ResponseEntity.ok(Map.of("url", "/oauth2/authorization/google"));
    }

    // Helper method to create refresh token
    private RefreshToken createRefreshToken(User user) {
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000);
        String token = jwtUtils.generateRefreshToken(user.getEmail(), user.getId());
        RefreshToken refreshToken = new RefreshToken(user, token, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    // Helper method to get client IP address
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
