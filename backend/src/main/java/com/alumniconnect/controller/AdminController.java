package com.alumniconnect.controller;

import com.alumniconnect.model.Booking;
import com.alumniconnect.model.Role;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.BookingRepository;
import com.alumniconnect.repository.UserRepository;
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
    @Autowired private BookingRepository bookingRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/pending-alumni")
    public ResponseEntity<List<User>> getPendingAlumni() {
        return ResponseEntity.ok(userRepository.findByRoleAndIsVerifiedFalse(Role.ALUMNI));
    }

    @PutMapping("/verify/{userId}")
    public ResponseEntity<?> verifyAlumni(@PathVariable @NonNull Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok("Alumni verified successfully.");
    }

    // --- NEW ADMIN SUPERPOWERS ---

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{userId}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable @NonNull Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        // Prevent admin from blocking themselves
        if(user.getRole() == Role.ADMIN) return ResponseEntity.badRequest().body("Cannot block an Admin.");
        
        user.setBlocked(!user.isBlocked());
        userRepository.save(user);
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
    public ResponseEntity<List<Booking>> getSystemLogs() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }
}