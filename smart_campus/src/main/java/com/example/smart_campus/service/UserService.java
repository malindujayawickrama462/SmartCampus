package com.example.smart_campus.service;

import com.example.smart_campus.model.User;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.repository.UserRepository;
import com.example.smart_campus.exception.ResourceNotFoundException;
import com.example.smart_campus.exception.BadRequestException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public List<User> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN);
    }

    @Transactional
    public User updateRole(Long id, Role newRole) {
        User user = getById(id);
        user.setRole(newRole);
        return userRepository.save(user);
    }

    @Transactional
    public User toggleActive(Long id) {
        User user = getById(id);
        user.setActive(!user.isActive());
        return userRepository.save(user);
    }

    @Transactional
    public User resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        User user = getById(id);
        if (!"local".equals(user.getProvider())) {
            throw new BadRequestException("Cannot reset password for OAuth users (provider: " + user.getProvider() + ")");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}
