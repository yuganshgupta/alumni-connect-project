package com.alumniconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "availability_slots")
public class Slot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(nullable = false)
    private LocalDateTime startTimeUtc;

    @Column(nullable = false)
    private LocalDateTime endTimeUtc;

    @Column(nullable = false)
    private boolean isBooked = false;

    @Version
    private Integer version;
}