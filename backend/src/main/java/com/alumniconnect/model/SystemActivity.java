package com.alumniconnect.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_activities")
public class SystemActivity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String action; // e.g., "USER_BANNED", "SLOT_REJECTED"
    private String details; // e.g., "Reason: Spamming the platform"
    private LocalDateTime timestamp = LocalDateTime.now();
}