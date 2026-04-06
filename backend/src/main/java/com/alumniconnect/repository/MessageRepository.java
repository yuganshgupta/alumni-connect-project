package com.alumniconnect.repository;

import com.alumniconnect.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) OR (m.sender.id = :user2 AND m.receiver.id = :user1) ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("user1") Long user1, @Param("user2") Long user2);

    // NEW: Count unread messages
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    // NEW: Mark messages as read when the chat is opened
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId")
    void markAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}