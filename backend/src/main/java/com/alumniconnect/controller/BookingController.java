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

    // SUPER-FILTER: Hides past slots, blocked mentors, and already booked slots
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
        return ResponseEntity.ok("Booking approved.");
    }

    // FIXED: Captures Reject Reason and logs it
    @PutMapping("/{bookingId}/reject")
    @Transactional
    public ResponseEntity<?> rejectBooking(@PathVariable @NonNull Long bookingId, @RequestBody Map<String, String> payload) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        booking.setStatus("REJECTED");
        booking.setCancellationReason(payload.get("reason"));
        bookingRepository.save(booking);

        Slot slot = booking.getSlot();
        slot.setBooked(false); // Free the slot for other students
        slotRepository.save(slot);

        SystemActivity log = new SystemActivity();
        log.setAction("SLOT_REJECTED");
        log.setDetails("Mentor rejected student " + booking.getStudent().getEmail() + ". Reason: " + payload.get("reason"));
        activityRepository.save(log);

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