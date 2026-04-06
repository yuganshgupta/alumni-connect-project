package com.alumniconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling; // NEW IMPORT

@SpringBootApplication
@EnableScheduling // Wakes up the background cron job engine
public class AlumniConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlumniConnectApplication.class, args);
    }

}