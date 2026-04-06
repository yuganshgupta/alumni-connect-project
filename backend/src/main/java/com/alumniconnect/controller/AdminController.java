package com.alumniconnect.controller;

import com.alumniconnect.model.*;
import com.alumniconnect.repository.*;
import com.alumniconnect.service.EmailService;
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
    
    // Inject the Email Service
    @Autowired private EmailService emailService;

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
        
        // --- NEW: VERIFICATION EMAIL ---
        try {
            emailService.sendSimpleEmail(user.getEmail(), "Account Verified! \uD83C\uDF89", 
                "Great news! Your Alumni Connect account has been verified. You can now log in and post your mentorship availability slots.");
        } catch (Exception e) {}
        
        return ResponseEntity.ok("Alumni verified successfully.");
    }

    @PutMapping("/users/{userId}/toggle-block")
    public ResponseEntity<?> toggleBlock(@PathVariable @NonNull Long userId, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        if(user.getRole() == Role.ADMIN) return ResponseEntity.badRequest().body("Cannot block an Admin.");
        
        user.setBlocked(!user.isBlocked());
        userRepository.save(user);

        String reason = payload.getOrDefault("reason", "No reason provided");

        SystemActivity log = new SystemActivity();
        log.setAction(user.isBlocked() ? "USER_BANNED" : "USER_UNBANNED");
        log.setDetails("Target: " + user.getEmail() + " | Reason: " + reason);
        activityRepository.save(log);

        // --- NEW: SUSPENSION / RESTORATION EMAILS ---
        try {
            if (user.isBlocked()) {
                emailService.sendSimpleEmail(user.getEmail(), "Account Suspended", 
                    "Notice: Your account has been temporarily suspended by the System Administrator. Reason: " + reason);
            } else {
                emailService.sendSimpleEmail(user.getEmail(), "Account Restored", 
                    "Notice: Your account access has been restored. You may now log in.");
            }
        } catch (Exception e) {}

        return ResponseEntity.ok(user.isBlocked() ? "User blocked." : "User restored.");
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable @NonNull Long userId, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setPassword(passwordEncoder.encode(payload.get("newPassword")));
        userRepository.save(user);
        
        // --- NEW: ADMIN OVERRIDE EMAIL ---
        try {
            emailService.sendSimpleEmail(user.getEmail(), "Password Reset by Administrator", 
                "Notice: Your password was just reset by a System Administrator. Please log in with the credentials provided to you and change your password immediately.");
        } catch (Exception e) {}
        
        return ResponseEntity.ok("Password updated successfully.");
    }

    @GetMapping("/system-logs")
    public ResponseEntity<List<SystemActivity>> getSystemLogs() {
        return ResponseEntity.ok(activityRepository.findAll());
    }
}