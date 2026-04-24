package com.example.smart_campus.controller;

import com.example.smart_campus.model.User;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.repository.UserRepository;
import com.example.smart_campus.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtils jwtUtils, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
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
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
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
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.status(201).body(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "email and password are required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            System.out.println("Login Failed: User not found for email: " + email);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials (user not found)"));
        }

        if (!"local".equals(user.getProvider())) {
            System.out.println("Login Failed: User registered via " + user.getProvider() + " for email: " + email);
            return ResponseEntity.status(403).body(Map.of("error", "Use OAuth login for this account"));
        }

        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            System.out.println("Login Failed: Incorrect password for email: " + email);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials (incorrect password)"));
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(Map.of("token", token));
    }

    // GET /api/auth/login/google - Initiate Google OAuth2 (redirect handled by Spring)
    @GetMapping("/login/google")
    public ResponseEntity<Map<String, String>> googleLogin() {
        return ResponseEntity.ok(Map.of("url", "/oauth2/authorization/google"));
    }
}
