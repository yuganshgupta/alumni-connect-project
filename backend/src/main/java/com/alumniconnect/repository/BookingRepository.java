package com.alumniconnect.repository;

import com.alumniconnect.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByStudentId(Long studentId);
    List<Booking> findBySlotMentorId(Long mentorId);

    // NEW: Find Approved sessions within the next 24 hours where the email hasn't been sent yet
    @Query("SELECT b FROM Booking b WHERE b.status = 'APPROVED' AND b.reminder24hSent = false AND b.slot.startTimeUtc <= :timeWindow AND b.slot.startTimeUtc > :now")
    List<Booking> findBookingsFor24hReminder(@Param("timeWindow") LocalDateTime timeWindow, @Param("now") LocalDateTime now);

    // NEW: Find Approved sessions within the next 1 hour where the email hasn't been sent yet
    @Query("SELECT b FROM Booking b WHERE b.status = 'APPROVED' AND b.reminder1hSent = false AND b.slot.startTimeUtc <= :timeWindow AND b.slot.startTimeUtc > :now")
    List<Booking> findBookingsFor1hReminder(@Param("timeWindow") LocalDateTime timeWindow, @Param("now") LocalDateTime now);
}