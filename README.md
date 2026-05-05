**Alumni Connect Platform** 🎓

A robust, full-stack web application designed to bridge the gap between students and university alumni. By utilizing a reverse-scheduling paradigm and an agenda-driven booking system, this platform eliminates the friction of manual networking and facilitates structured, high-quality mentorship sessions.

**🚀 Key Features**

*   **🔐 Secure Authentication & RBAC:** Stateless JWT-based authentication with strict Role-Based Access Control (RBAC) separating Students, Alumni, and System Administrators.
*   **🛡️ Admin Verification Workflow:** Alumni accounts are placed under review upon registration and cannot publish availability until manually verified by an Administrator, ensuring platform integrity.
*   **📅 Reverse-Scheduling Engine:** Verified alumni publish fixed availability slots (automatically normalized to UTC), and students book them by submitting a mandatory session agenda.
*   **💬 In-App Messaging:** A built-in chat interface allowing students and mentors to coordinate pre-meeting details and share external meeting links (e.g., Google Meet).
*   **📧 Automated Email Reminders:** A Spring Boot CRON job runs autonomously to dispatch SMTP email alerts 24 hours and 1 hour before approved sessions, drastically reducing no-shows.
*   **📊 Status Tracking:** Comprehensive dashboard for alumni to manage requests (Approve/Decline) and track session outcomes (Completed/No-Show).

**🛠 Tech Stack**

*   **Frontend:** React.js (Vite), React Router DOM (Protected Routing), JavaScript / CSS
*   **Backend:** Java 17 / Spring Boot, Spring Security & JSON Web Tokens (JWT), Spring Data JPA (Hibernate), JavaMailSender (SMTP)
*   **Database:** MySQL 8.0

**⚙️ Setup Instructions**

**1. Clone Repository**
`git clone [https://github.com/YOUR_USERNAME/alumni-connect-project.git](https://github.com/YOUR_USERNAME/alumni-connect-project.git)`
`cd alumni-connect-project`

**2. Backend Setup (Spring Boot)**
*   Ensure **MySQL** is running on your local machine.
*   Create the database: `CREATE DATABASE alumni_connect_db;`
*   Open `src/main/resources/application.properties` and configure your environment variables:
    *   `spring.datasource.url=jdbc:mysql://localhost:3306/alumni_connect_db`
    *   `spring.datasource.username=root`
    *   `spring.datasource.password=YOUR_DB_PASSWORD`
    *   `jwt.secret=YOUR_SUPER_SECRET_JWT_KEY_MAKE_IT_LONG`
    *   `jwt.expiration=86400000`
    *   `spring.mail.username=your_email@gmail.com`
    *   `spring.mail.password=your_gmail_app_password`
*   Run the backend: `mvn spring-boot:run`

**3. Frontend Setup**
*   Open a new terminal and navigate to the frontend directory: `cd frontend`
*   Install dependencies: `npm install`
*   Start the development server: `npm run dev`
*   Open your browser and navigate to: `http://localhost:5173`

**📂 Project Structure**
`alumni-connect-project/`
`├── frontend/        # React UI, Context API, Axios Interceptors`
`├── backend/         # Spring Boot REST APIs, Security, CRON Scheduler`
`└── README.md`

**🧠 Future Improvements**

*   **🌐 WebSocket Integration:** Upgrade the current HTTP-polling chat mechanism to Spring WebSockets (STOMP protocol) for lower-latency, real-time messaging.
*   **🎥 Native Video Conferencing:** Integrate WebRTC or Zoom SDK to allow mentorship meetings to happen directly inside the browser window (replacing manual Google Meet links).
*   **🤖 AI-Powered Resume Feedback:** Integrate a local LLM to provide students with automated, first-pass formatting feedback on their resumes before submitting them to alumni.
*   **📱 Mobile Application:** Develop a React Native companion app for immediate push notifications.

**👤 Authors**
Yugansh Gupta, Ashish Goyal, Kunal Rajput

**📄 License**
This project was developed for educational purposes as a Minor Project submission.
