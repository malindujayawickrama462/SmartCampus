package com.example.smart_campus.service;

import com.example.smart_campus.model.User;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.repository.UserRepository;
import com.example.smart_campus.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
    public User update(Long id, User updates) {
        User user = getById(id);
        user.setEmail(updates.getEmail());
        user.setName(updates.getName());
        user.setRole(updates.getRole());
        if (updates.getAvatarUrl() != null) {
            user.setAvatarUrl(updates.getAvatarUrl());
        }
        return userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}
