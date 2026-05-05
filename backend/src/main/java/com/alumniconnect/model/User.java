package com.alumniconnect.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String name;
    private String company;
    private boolean isVerified = false; 
    
    @Column(nullable = false)
    private boolean isBlocked = false;

    // --- PROFILE FIELDS ---
    @Column(length = 500)
    private String linkedinUrl;
    
    @Column(length = 2000)
    private String experience;
    
    @Column(length = 500)
    private String resumeUrl;
    
    @Column(length = 500)
    private String profileImageUrl;

    // --- NEW: Personal Meeting Room Link ---
    @Column(length = 500)
    private String meetingLink;

    // --- NEW: Temporary OTP Field (Not saved to DB) ---
    @Transient
    private String otp;

}