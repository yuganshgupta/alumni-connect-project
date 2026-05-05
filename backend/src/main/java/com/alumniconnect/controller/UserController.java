package com.alumniconnect.controller;

import com.alumniconnect.model.NotificationPreferences;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.NotificationPreferencesRepository;
import com.alumniconnect.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private NotificationPreferencesRepository prefsRepository; 

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getProfile(@PathVariable @NonNull Long id) {
        return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable @NonNull Long id, @RequestBody User updatedData) {
        try {
            User user = userRepository.findById(id).orElseThrow();
            user.setLinkedinUrl(updatedData.getLinkedinUrl());
            user.setExperience(updatedData.getExperience());
            user.setProfileImageUrl(updatedData.getProfileImageUrl());
            user.setCompany(updatedData.getCompany());
            
            // NEW: Save the meeting link
            user.setMeetingLink(updatedData.getMeetingLink());
            
            userRepository.save(user);
            return ResponseEntity.ok(user);
        } catch (Exception e) { return ResponseEntity.badRequest().body("Failed."); }
    }

    // --- NOTIFICATION PREFERENCES ENDPOINTS ---
    
    @GetMapping("/{id}/preferences")
    public ResponseEntity<NotificationPreferences> getPreferences(@PathVariable @NonNull Long id) {
        User user = userRepository.findById(id).orElseThrow();
        // If they don't have preferences yet, return a default true object
        NotificationPreferences prefs = prefsRepository.findByUserId(id).orElseGet(() -> {
            NotificationPreferences newPrefs = new NotificationPreferences();
            newPrefs.setUser(user);
            return newPrefs;
        });
        return ResponseEntity.ok(prefs);
    }

    @PutMapping("/{id}/preferences")
    public ResponseEntity<?> updatePreferences(@PathVariable @NonNull Long id, @RequestBody NotificationPreferences updatedPrefs) {
        User user = userRepository.findById(id).orElseThrow();
        NotificationPreferences prefs = prefsRepository.findByUserId(id).orElse(new NotificationPreferences());
        
        prefs.setUser(user);
        prefs.setBookingUpdates(updatedPrefs.isBookingUpdates());
        prefs.setSessionReminders(updatedPrefs.isSessionReminders());
        prefs.setChatAlerts(updatedPrefs.isChatAlerts());
        
        prefsRepository.save(prefs);
        return ResponseEntity.ok("Preferences updated");
    }
}