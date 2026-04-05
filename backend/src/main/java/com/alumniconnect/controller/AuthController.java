package com.alumniconnect.controller;

import com.alumniconnect.model.Role;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Check Admin Ban
            if (user.isBlocked()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account has been suspended by the System Administrator.");
            }

            if (passwordEncoder.matches(password, user.getPassword())) {
                Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
                String token = Jwts.builder()
                        .setSubject(user.getEmail())
                        .claim("role", user.getRole().name())
                        .claim("id", user.getId())
                        .setIssuedAt(new Date())
                        .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                        .signWith(key, SignatureAlgorithm.HS256)
                        .compact();

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("user", user);
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {
        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = new User();
        user.setEmail(newUser.getEmail());
        user.setPassword(passwordEncoder.encode(newUser.getPassword()));
        user.setName(newUser.getName());
        user.setRole(newUser.getRole() != null ? newUser.getRole() : Role.STUDENT);
        user.setCompany(newUser.getCompany());
        user.setVerified(user.getRole() == Role.STUDENT);
        user.setBlocked(false);

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }
}