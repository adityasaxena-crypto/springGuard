package com.example.controller;

import com.example.entity.User;
import com.example.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // ❌ Bad: Field injection (not recommended)
    @Autowired
    private UserRepository userRepository;

    // ❌ Bad: Controller directly accesses Repository (should use Service)
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ❌ Bad: Business logic in Controller
    @PostMapping
    public User createUser(@RequestBody User user) {
        // Validation logic in controller (should be in service)
        if (user.getName() == null || user.getName().isEmpty()) {
            throw new RuntimeException("Name is required");
        }
        if (user.getEmail() == null || !user.getEmail().contains("@")) {
            throw new RuntimeException("Invalid email");
        }
        
        // Business logic in controller (should be in service)
        user.setName(user.getName().trim().toLowerCase());
        user.setEmail(user.getEmail().toLowerCase());
        
        return userRepository.save(user);
    }

    // ❌ Bad: No @Transactional on write operation
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        User existing = userRepository.findById(id).orElseThrow();
        existing.setName(user.getName());
        existing.setEmail(user.getEmail());
        return userRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}
