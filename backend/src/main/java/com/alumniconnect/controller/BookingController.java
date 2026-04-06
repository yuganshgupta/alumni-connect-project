package com.alumniconnect.controller;

import com.alumniconnect.model.*;
import com.alumniconnect.repository.*;
import com.alumniconnect.service.EmailService;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired private SlotRepository slotRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SystemActivityRepository activityRepository;
    @Autowired private EmailService emailService;
    
    // NEW: Inject Preferences Repository
    @Autowired private NotificationPreferencesRepository prefsRepository;

    // Helper method to check preferences (defaults to true if record doesn't exist)
    private boolean wantsBookingUpdates(Long userId) {
        return prefsRepository.findByUserId(userId)
                .map(NotificationPreferences::isBookingUpdates)
                .orElse(true);
    }

    @GetMapping("/slots")
    public List<Slot> getAvailableSlots() { 
        return slotRepository.findByIsBookedFalse().stream()
            .filter(slot -> !slot.getMentor().isBlocked())
            .filter(slot -> slot.getStartTimeUtc().isAfter(LocalDateTime.now())) 
            .collect(Collectors.toList());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Booking>> getStudentBookings(@PathVariable @NonNull Long studentId) {
        return ResponseEntity.ok(bookingRepository.findByStudentId(studentId));
    }

    @PostMapping("/book/{slotId}/{studentId}")
    @Transactional 
    public ResponseEntity<?> bookSlot(@PathVariable @NonNull Long slotId, @PathVariable @NonNull Long studentId, @RequestBody Map<String, String> payload) {
        try {
            Slot slot = slotRepository.findById(slotId).orElseThrow();
            if (slot.isBooked()) return ResponseEntity.badRequest().body("Slot is already booked.");
            
            User student = userRepository.findById(studentId).orElseThrow();
            if (student.getRole() != Role.STUDENT) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can book.");

            slot.setBooked(true);
            slotRepository.save(slot);

            Booking booking = new Booking();
            booking.setSlot(slot);
            booking.setStudent(student);
            booking.setStatus("PENDING");
            booking.setStudentAgenda(payload.getOrDefault("agenda", "No agenda provided"));
            bookingRepository.save(booking);

            // 1. ALERT THE MENTOR (If preference is ON)
            if (wantsBookingUpdates(slot.getMentor().getId())) {
                try {
                    emailService.sendSimpleEmail(slot.getMentor().getEmail(), "New Mentorship Request", 
                        "Student " + student.getEmail() + " has requested a session.\nAgenda: " + booking.getStudentAgenda());
                } catch (Exception e) {}
            }

            // 2. CONFIRMATION TO THE STUDENT (If preference is ON)
            if (wantsBookingUpdates(student.getId())) {
                try {
                    String mentorName = slot.getMentor().getName() != null ? slot.getMentor().getName() : "your requested mentor";
                    emailService.sendSimpleEmail(student.getEmail(), "Session Request Sent \uD83D\uDCE4", 
                        "Your mentorship session request has been successfully sent to " + mentorName + ".\n\nYou will be notified via email as soon as they approve or decline the request.");
                } catch (Exception e) {}
            }

            return ResponseEntity.ok(booking);
        } catch (Exception e) { return ResponseEntity.internalServerError().body("Booking failed."); }
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Booking>> getMentorBookings(@PathVariable @NonNull Long mentorId) {
        return ResponseEntity.ok(bookingRepository.findBySlotMentorId(mentorId));
    }

    @PutMapping("/{bookingId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable @NonNull Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus("APPROVED");
        bookingRepository.save(booking);
        
        // EMAIL STUDENT (If preference is ON)
        if (wantsBookingUpdates(booking.getStudent().getId())) {
            try {
                emailService.sendSimpleEmail(booking.getStudent().getEmail(), "Session Approved \uD83C\uDF89", 
                    "Great news! Your mentor has approved your upcoming session request. Please check your dashboard for chat access.");
            } catch (Exception e) {}
        }
            
        return ResponseEntity.ok("Booking approved.");
    }

    @PutMapping("/{bookingId}/reject")
    @Transactional
    public ResponseEntity<?> rejectBooking(@PathVariable @NonNull Long bookingId, @RequestBody Map<String, String> payload) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus("REJECTED");
        booking.setCancellationReason(payload.get("reason"));
        bookingRepository.save(booking);

        Slot slot = booking.getSlot();
        slot.setBooked(false); 
        slotRepository.save(slot);

        SystemActivity log = new SystemActivity();
        log.setAction("SLOT_REJECTED");
        log.setDetails("Mentor rejected student " + booking.getStudent().getEmail() + ". Reason: " + payload.get("reason"));
        activityRepository.save(log);

        // EMAIL STUDENT (If preference is ON)
        if (wantsBookingUpdates(booking.getStudent().getId())) {
            try {
                emailService.sendSimpleEmail(booking.getStudent().getEmail(), "Session Declined", 
                    "Your mentor had to decline your session request. Reason: " + payload.get("reason"));
            } catch (Exception e) {}
        }

        return ResponseEntity.ok("Booking rejected.");
    }

    @PutMapping("/{bookingId}/cancel")
    @Transactional
    public ResponseEntity<?> cancelBooking(@PathVariable @NonNull Long bookingId, @RequestBody Map<String, String> payload) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus("CANCELLED");
        booking.setCancellationReason(payload.get("reason"));
        bookingRepository.save(booking);

        Slot slot = booking.getSlot();
        slot.setBooked(false); 
        slotRepository.save(slot);

        // EMAIL STUDENT (If preference is ON)
        if (wantsBookingUpdates(booking.getStudent().getId())) {
            try {
                emailService.sendSimpleEmail(booking.getStudent().getEmail(), "Session Cancelled", 
                    "An approved session was cancelled. Reason: " + payload.get("reason"));
            } catch (Exception e) {}
        }

        // OPTIONAL: If a student cancels, you might want to email the mentor here too!
        if (wantsBookingUpdates(booking.getSlot().getMentor().getId())) {
            try {
                emailService.sendSimpleEmail(booking.getSlot().getMentor().getEmail(), "Session Cancelled", 
                    "An approved session was cancelled. Reason: " + payload.get("reason"));
            } catch (Exception e) {}
        }

        return ResponseEntity.ok("Booking cancelled.");
    }

    @PutMapping("/{bookingId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable @NonNull Long bookingId, @RequestParam String status) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus(status.toUpperCase());
        bookingRepository.save(booking);
        return ResponseEntity.ok("Status updated.");
    }
}