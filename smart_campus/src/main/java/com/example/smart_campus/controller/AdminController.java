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
    public ResponseEntity<User> updateRole(@PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        Role role = Role.valueOf(body.get("role"));
        return ResponseEntity.ok(userService.updateRole(id, role));
    }
}
