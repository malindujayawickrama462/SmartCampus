package com.example.smart_campus;

import com.example.smart_campus.model.User;
import com.example.smart_campus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataFixer implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataFixer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Running DataFixer to reactivate accounts...");
        List<User> users = userRepository.findAll();
        boolean changed = false;
        for (User user : users) {
             if (!user.isActive()) {
                 user.setActive(true);
                 userRepository.save(user);
                 System.out.println("Reactivated user: " + user.getEmail());
                 changed = true;
             }
        }
        if (changed) {
             System.out.println("Finished reactivating users.");
        } else {
             System.out.println("All users are already active.");
        }
    }
}
