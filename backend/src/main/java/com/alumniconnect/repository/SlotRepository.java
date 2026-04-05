package com.alumniconnect.repository;

import com.alumniconnect.model.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByIsBookedFalse();
    List<Slot> findByMentorId(Long mentorId);
}