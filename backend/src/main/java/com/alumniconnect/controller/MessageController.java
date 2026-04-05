package com.alumniconnect.controller;

import com.alumniconnect.model.Message;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.MessageRepository;
import com.alumniconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired private MessageRepository messageRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/{user1}/{user2}")
    public ResponseEntity<List<Message>> getChatHistory(@PathVariable Long user1, @PathVariable Long user2) {
        return ResponseEntity.ok(messageRepository.findChatHistory(user1, user2));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> payload) {
        try {
            User sender = userRepository.findById(Long.parseLong(payload.get("senderId"))).orElseThrow();
            User receiver = userRepository.findById(Long.parseLong(payload.get("receiverId"))).orElseThrow();
            
            Message msg = new Message();
            msg.setSender(sender);
            msg.setReceiver(receiver);
            msg.setContent(payload.get("content"));
            messageRepository.save(msg);
            
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send message");
        }
    }
}