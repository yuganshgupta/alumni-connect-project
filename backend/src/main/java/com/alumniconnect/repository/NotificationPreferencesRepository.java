package com.alumniconnect.repository;

import com.alumniconnect.model.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {
    Optional<NotificationPreferences> findByUserId(Long userId);
}