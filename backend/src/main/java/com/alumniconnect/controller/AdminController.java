package com.alumniconnect.controller;

import com.alumniconnect.model.*;
import com.alumniconnect.repository.*;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private SystemActivityRepository activityRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() { return ResponseEntity.ok(userRepository.findAll()); }

    @PutMapping("/verify/{userId}")
    public ResponseEntity<?> verifyAlumni(@PathVariable @NonNull Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setVerified(true);
        userRepository.save(user);
        
        SystemActivity log = new SystemActivity();
        log.setAction("USER_VERIFIED");
        log.setDetails("Admin approved alumni account: " + user.getEmail());
        activityRepository.save(log);
        
        return ResponseEntity.ok("Alumni verified successfully.");
    }

    @PutMapping("/users/{userId}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable @NonNull Long userId, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        if(user.getRole() == Role.ADMIN) return ResponseEntity.badRequest().body("Cannot block an Admin.");
        
        user.setBlocked(!user.isBlocked());
        userRepository.save(user);

        SystemActivity log = new SystemActivity();
        log.setAction(user.isBlocked() ? "USER_BANNED" : "USER_UNBANNED");
        log.setDetails("Target: " + user.getEmail() + " | Reason: " + payload.getOrDefault("reason", "No reason provided"));
        activityRepository.save(log);

        return ResponseEntity.ok(user.isBlocked() ? "User blocked." : "User restored.");
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable @NonNull Long userId, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setPassword(passwordEncoder.encode(payload.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok("Password updated successfully.");
    }

    @GetMapping("/system-logs")
    public ResponseEntity<List<SystemActivity>> getSystemLogs() {
        return ResponseEntity.ok(activityRepository.findAll());
    }
}