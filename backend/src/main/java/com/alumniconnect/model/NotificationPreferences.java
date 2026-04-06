package com.alumniconnect.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "notification_preferences")
public class NotificationPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Default all opt-in preferences to TRUE
    @Column(nullable = false)
    private boolean bookingUpdates = true;

    @Column(nullable = false)
    private boolean sessionReminders = true;

    @Column(nullable = false)
    private boolean chatAlerts = true;
}