package com.alumniconnect.repository;

import com.alumniconnect.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByStudentId(Long studentId);
    List<Booking> findBySlotMentorId(Long mentorId);
}