package com.alumniconnect.controller;

import com.alumniconnect.model.EmailOtp;
import com.alumniconnect.model.PasswordResetToken;
import com.alumniconnect.model.Role;
import com.alumniconnect.model.User;
import com.alumniconnect.repository.EmailOtpRepository;
import com.alumniconnect.repository.PasswordResetTokenRepository;
import com.alumniconnect.repository.UserRepository;
import com.alumniconnect.service.EmailService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    
    // NEW: Inject the OTP Repository
    @Autowired private EmailOtpRepository otpRepository;

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
            if (user.isBlocked()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account suspended.");

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

    // --- NEW: SEND OTP ENDPOINT ---
    @PostMapping("/send-otp")
    @Transactional
    public ResponseEntity<?> sendRegistrationOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String roleStr = request.get("role");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        // Domain Check for Alumni
        if ("ALUMNI".equals(roleStr) && !email.toLowerCase().endsWith("@bvicam.in")) {
            return ResponseEntity.badRequest().body("Alumni registration is strictly restricted to @bvicam.in email addresses.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already in use!");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));

        otpRepository.deleteByEmail(email);
        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(email);
        emailOtp.setOtp(otp);
        emailOtp.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(emailOtp);

        emailService.sendSimpleEmail(email, "Your Alumni Connect Verification Code", 
            "Hello,\n\nYour 6-digit verification code is: " + otp + "\n\nThis code will expire in 5 minutes. If you did not request this, please ignore this email.");

        return ResponseEntity.ok("OTP sent successfully to " + email);
    }

    // --- UPDATED: REGISTER ENDPOINT ---
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {
        // 1. Verify OTP First
        if (newUser.getOtp() == null || newUser.getOtp().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Verification code is required.");
        }

        Optional<EmailOtp> otpOptional = otpRepository.findByEmail(newUser.getEmail());
        if (otpOptional.isEmpty() || !otpOptional.get().getOtp().equals(newUser.getOtp())) {
            return ResponseEntity.badRequest().body("Invalid verification code.");
        }

        if (otpOptional.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            otpRepository.deleteByEmail(newUser.getEmail());
            return ResponseEntity.badRequest().body("Verification code has expired. Please request a new one.");
        }

        // 2. Double Check Alumni Domain
        if (newUser.getRole() == Role.ALUMNI && !newUser.getEmail().toLowerCase().endsWith("@bvicam.in")) {
            return ResponseEntity.badRequest().body("Alumni registration is strictly restricted to @bvicam.in email addresses.");
        }

        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already in use!");
        }

        // 3. Save User
        User user = new User();
        user.setEmail(newUser.getEmail());
        user.setPassword(passwordEncoder.encode(newUser.getPassword()));
        user.setName(newUser.getName());
        user.setRole(newUser.getRole() != null ? newUser.getRole() : Role.STUDENT);
        user.setCompany(newUser.getCompany());
        user.setVerified(user.getRole() == Role.STUDENT);
        user.setBlocked(false);
        userRepository.save(user);
        
        otpRepository.deleteByEmail(newUser.getEmail());

        // 4. Welcome Emails
        try {
            if (user.getRole() == Role.ALUMNI) {
                emailService.sendSimpleEmail(user.getEmail(), "Welcome to Alumni Connect - Account Under Review", 
                    "Hello " + user.getName() + ",\n\nWelcome! Your mentor account is currently under review by our Admin team. We will notify you once verified so you can start posting availability.");
                
                List<User> admins = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.ADMIN).collect(Collectors.toList());
                        
                for (User admin : admins) {
                    emailService.sendSimpleEmail(admin.getEmail(), "Action Required: New Alumni Registration", 
                        "A new Alumni Mentor (" + user.getName() + " - " + user.getEmail() + ") has registered and verified their email. Please log in to the Admin Dashboard to review and approve their account.");
                }
            } else if (user.getRole() == Role.STUDENT) {
                emailService.sendSimpleEmail(user.getEmail(), "Welcome to Alumni Connect!", 
                    "Hello " + user.getName() + ",\n\nWelcome to Alumni Connect! You can now log in and start browsing available mentors today.");
            }
        } catch (Exception e) {}

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            tokenRepository.deleteByUserId(user.getId());

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(token);
            resetToken.setUser(user);
            resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            tokenRepository.save(resetToken);

            String resetLink = "http://localhost:5173/reset-password?token=" + token;
            String emailBody = "Hello " + user.getName() + ",\n\nYou requested a password reset. Click the link below to set a new password:\n\n" + resetLink + "\n\nThis link expires in 15 minutes.";
            
            emailService.sendSimpleEmail(user.getEmail(), "Password Reset Request", emailBody);
        }
        
        return ResponseEntity.ok("If an account exists with that email, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByToken(token);

        if (tokenOptional.isEmpty()) return ResponseEntity.badRequest().body("Invalid or missing token.");

        PasswordResetToken resetToken = tokenOptional.get();

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            return ResponseEntity.badRequest().body("Token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);

        return ResponseEntity.ok("Password has been successfully reset. You can now log in.");
    }
}