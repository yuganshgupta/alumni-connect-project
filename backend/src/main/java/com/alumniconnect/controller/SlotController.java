package com.alumniconnect.controller;

import com.alumniconnect.model.Role;
import com.alumniconnect.model.Slot;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.SlotRepository;
import com.alumniconnect.repository.UserRepository;
import org.springframework.lang.NonNull; // <--- ADDED IMPORT
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    @Autowired private SlotRepository slotRepository;
    @Autowired private UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createSlot(@RequestBody Map<String, String> payload) {
        try {
            Long mentorId = Long.parseLong(payload.get("mentorId"));
            User mentor = userRepository.findById(mentorId).orElseThrow(() -> new RuntimeException("Mentor not found"));

            if (mentor.getRole() != Role.ALUMNI || !mentor.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only verified alumni can post slots.");
            }

            LocalDateTime startTime = LocalDateTime.parse(payload.get("startTimeUtc"), DateTimeFormatter.ISO_DATE_TIME);
            if (startTime.isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body("Cannot create availability slots in the past.");
            }

            LocalDateTime endTime = LocalDateTime.parse(payload.get("endTimeUtc"), DateTimeFormatter.ISO_DATE_TIME);

            Slot slot = new Slot();
            slot.setMentor(mentor);
            slot.setStartTimeUtc(startTime);
            slot.setEndTimeUtc(endTime);
            slot.setBooked(false);
            slot.setVersion(0);

            slotRepository.save(slot);
            return ResponseEntity.ok("Slot created successfully");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating slot: " + e.getMessage());
        }
    }

    // FIXED: Added @NonNull to the path variables
    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Slot>> getMentorSlots(@PathVariable @NonNull Long mentorId) {
        return ResponseEntity.ok(slotRepository.findByMentorId(mentorId));
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<?> deleteSlot(@PathVariable @NonNull Long slotId) {
        try {
            slotRepository.deleteById(slotId);
            return ResponseEntity.ok("Slot deleted.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete booked slot.");
        }
    }
}