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

    // --- NEW PROFILE FIELDS ---
    @Column(length = 500)
    private String linkedinUrl;
    
    @Column(length = 2000)
    private String experience;
    
    @Column(length = 500)
    private String resumeUrl; // In a real app, this would point to an AWS S3 bucket
    
    @Column(length = 500)
    private String profileImageUrl;
}