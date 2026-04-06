package com.alumniconnect.service;

import com.alumniconnect.model.Booking;
import com.alumniconnect.model.NotificationPreferences;
import com.alumniconnect.repository.BookingRepository;
import com.alumniconnect.repository.NotificationPreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailScheduler {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private EmailService emailService;
    @Autowired private NotificationPreferencesRepository prefsRepository;

    // Runs in the background automatically every 10 minutes (600,000 milliseconds)
    @Scheduled(fixedRate = 600000)
    @Transactional
    public void sendSessionReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24Hours = now.plusHours(24);
        LocalDateTime in1Hour = now.plusHours(1);

        // --- 1. PROCESS 24-HOUR REMINDERS ---
        List<Booking> bookings24h = bookingRepository.findBookingsFor24hReminder(in24Hours, now);
        for (Booking booking : bookings24h) {
            sendReminderEmails(booking, "24 hours");
            
            // Mark as sent so we don't spam them 10 minutes from now
            booking.setReminder24hSent(true);
            bookingRepository.save(booking);
            System.out.println("Automated 24h reminder sent for Booking ID: " + booking.getId());
        }

        // --- 2. PROCESS 1-HOUR REMINDERS ---
        List<Booking> bookings1h = bookingRepository.findBookingsFor1hReminder(in1Hour, now);
        for (Booking booking : bookings1h) {
            sendReminderEmails(booking, "1 hour");
            
            booking.setReminder1hSent(true);
            bookingRepository.save(booking);
            System.out.println("Automated 1h reminder sent for Booking ID: " + booking.getId());
        }
    }

    private void sendReminderEmails(Booking booking, String timeFrame) {
        // Fetch preferences (defaulting to TRUE if record doesn't exist yet)
        boolean studentWantsReminders = prefsRepository.findByUserId(booking.getStudent().getId())
                .map(NotificationPreferences::isSessionReminders).orElse(true);
                
        boolean mentorWantsReminders = prefsRepository.findByUserId(booking.getSlot().getMentor().getId())
                .map(NotificationPreferences::isSessionReminders).orElse(true);

        String timeStr = booking.getSlot().getStartTimeUtc().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
        String subject = "Reminder: Upcoming Mentorship Session in " + timeFrame;

        // Email to Student
        if (studentWantsReminders) {
            String studentBody = "Hello " + booking.getStudent().getName() + ",\n\n" +
                    "This is an automated reminder that your mentorship session with " + booking.getSlot().getMentor().getName() + 
                    " starts in exactly " + timeFrame + " (" + timeStr + " UTC).\n\n" +
                    "Agenda: " + booking.getStudentAgenda() + "\n\n" +
                    "Please log in to your dashboard to access the chat and coordinate with your mentor.";
            
            emailService.sendSimpleEmail(booking.getStudent().getEmail(), subject, studentBody);
        }

        // Email to Mentor
        if (mentorWantsReminders) {
            String mentorBody = "Hello " + booking.getSlot().getMentor().getName() + ",\n\n" +
                    "This is an automated reminder that your mentorship session with " + booking.getStudent().getName() + 
                    " starts in exactly " + timeFrame + " (" + timeStr + " UTC).\n\n" +
                    "Agenda: " + booking.getStudentAgenda() + "\n\n" +
                    "Please log in to your dashboard to access the chat and coordinate with your student.";
            
            emailService.sendSimpleEmail(booking.getSlot().getMentor().getEmail(), subject, mentorBody);
        }
    }
}