package com.alumniconnect.controller;

import com.alumniconnect.model.Booking;
import com.alumniconnect.model.Role;
import com.alumniconnect.model.Slot;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.BookingRepository;
import com.alumniconnect.repository.SlotRepository;
import com.alumniconnect.repository.UserRepository;
import com.alumniconnect.service.EmailService;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired private SlotRepository slotRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailService emailService;

    @GetMapping("/slots")
    public List<Slot> getAvailableSlots() { return slotRepository.findByIsBookedFalse(); }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Booking>> getStudentBookings(@PathVariable @NonNull Long studentId) {
        return ResponseEntity.ok(bookingRepository.findByStudentId(studentId));
    }

    @PostMapping("/book/{slotId}/{studentId}")
    @Transactional 
    public ResponseEntity<?> bookSlot(@PathVariable @NonNull Long slotId, @PathVariable @NonNull Long studentId, @RequestBody Map<String, String> payload) {
        try {
            Slot slot = slotRepository.findById(slotId).orElseThrow(() -> new RuntimeException("Slot not found"));
            if (slot.isBooked()) return ResponseEntity.badRequest().body("Slot is already booked.");
            
            User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

            // SECURITY: Prevent Alumni or Admins from booking slots meant for students
            if (student.getRole() != Role.STUDENT) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only registered students can book mentorship slots.");
            }

            slot.setBooked(true);
            slotRepository.save(slot);

            Booking booking = new Booking();
            booking.setSlot(slot);
            booking.setStudent(student);
            booking.setStatus("PENDING");
            booking.setStudentAgenda(payload.getOrDefault("agenda", "No agenda provided"));
            bookingRepository.save(booking);

            try { emailService.sendBookingNotification(student.getEmail(), "Booking Requested", "Your request is pending mentor approval.");
            } catch (Exception e) {}

            return ResponseEntity.ok(booking);
        } catch (Exception e) { return ResponseEntity.internalServerError().body("Booking failed: " + e.getMessage()); }
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Booking>> getMentorBookings(@PathVariable @NonNull Long mentorId) {
        return ResponseEntity.ok(bookingRepository.findBySlotMentorId(mentorId));
    }

    @PutMapping("/{bookingId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable @NonNull Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus("APPROVED");
        bookingRepository.save(booking);
        try { emailService.sendBookingNotification(booking.getStudent().getEmail(), "Booking Approved", "Mentor approved!"); } catch (Exception e) {}
        return ResponseEntity.ok("Booking approved.");
    }

    @PutMapping("/{bookingId}/reject")
    @Transactional
    public ResponseEntity<?> rejectBooking(@PathVariable @NonNull Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus("REJECTED");
        bookingRepository.save(booking);

        Slot slot = booking.getSlot();
        slot.setBooked(false); 
        slotRepository.save(slot);
        return ResponseEntity.ok("Booking rejected.");
    }

    @PutMapping("/{bookingId}/cancel")
    @Transactional
    public ResponseEntity<?> cancelBooking(@PathVariable @NonNull Long bookingId, @RequestBody Map<String, String> payload) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
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
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(status.toUpperCase());
        bookingRepository.save(booking);
        return ResponseEntity.ok("Status updated.");
    }
}