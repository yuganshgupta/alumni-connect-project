package com.alumniconnect.controller;

import com.alumniconnect.model.User;
import com.alumniconnect.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable @NonNull Long id, @RequestBody User updatedData) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setLinkedinUrl(updatedData.getLinkedinUrl());
            user.setExperience(updatedData.getExperience());
            user.setResumeUrl(updatedData.getResumeUrl());
            user.setProfileImageUrl(updatedData.getProfileImageUrl());
            user.setCompany(updatedData.getCompany());
            // We do NOT update role, email, or verification status here for security.

            userRepository.save(user);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update profile: " + e.getMessage());
        }
    }
}