package com.alumniconnect;

import jakarta.annotation.PostConstruct; // NEW
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone; // NEW

@SpringBootApplication
@EnableScheduling 
public class AlumniConnectApplication {

    // --- NEW: FORCE ENTIRE APP TO USE UTC ---
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    public static void main(String[] args) {
        SpringApplication.run(AlumniConnectApplication.class, args);
    }
}