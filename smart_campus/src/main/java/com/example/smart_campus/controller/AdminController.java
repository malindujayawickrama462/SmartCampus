package com.example.smart_campus.controller;

import com.example.smart_campus.model.User;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/admin/users - List all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAll());
    }

    // PUT /api/admin/users/{id}/role - Change user role
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null || roleStr.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }
        try {
            Role role = Role.valueOf(roleStr.trim());
            return ResponseEntity.ok(userService.updateRole(id, role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Invalid role. Must be one of: USER, ADMIN, TECHNICIAN"));
        }
    }

    // PUT /api/admin/users/{id}/status - Toggle active/deactivated
    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id,
                                          @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.smart_campus.model.User currentUser) {
        if (currentUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot deactivate your own account"));
        }
        return ResponseEntity.ok(userService.toggleActive(id));
    }

    // PUT /api/admin/users/{id}/reset-password - Admin resets user password
    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
        userService.resetPassword(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
    }
}
