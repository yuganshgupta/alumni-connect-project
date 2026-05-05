package com.alumniconnect.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne 
    @JoinColumn(name = "slot_id", nullable = false)
    private Slot slot;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private String status; 
    
    @Column(length = 1000)
    private String studentAgenda; 

    @Column(length = 1000)
    private String cancellationReason; 

    // --- AUTOMATED EMAIL TRACKING FLAGS ---
    @Column(nullable = false)
    private boolean reminder24hSent = false;

    @Column(nullable = false)
    private boolean reminder1hSent = false;

    // --- NEW: Unique Jitsi Room ID ---
    @Column(length = 500)
    private String meetingUrl;
}