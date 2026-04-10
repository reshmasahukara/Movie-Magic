# Movie Magic - Ticket Booking System

## 🎬 Project Overview
**Movie Magic** is a comprehensive web-based movie ticket booking application designed to provide a seamless experience for both movie-goers and theater administrators. The system allows users to browse current movies, select showtimes, book specific seats, and manage their profiles. Administrators have a dedicated dashboard to manage the movie catalog, theater schedules, and customer data.

---

## 🚀 Key Features

### User Features
- **Fast Registration & Login**: Simple signup process with secure password handling.
- **Dynamic Movie Catalog**: Browse movies with detailed information, ratings, genres, and languages.
- **Interactive Seat Selection**: Visual representation of theater screens with real-time seat availability.
- **Multi-Theater Support**: Choose from various theaters and locations for a single movie.
- **Personal Profile**: Users can manage their account information and view booking history.
- **Responsive UI**: A modern, mobile-friendly interface built with Bootstrap.

### Admin Features
- **Centralized Dashboard**: Oversight of all system operations.
- **Movie Management**: Add, update, or remove movies from the listing.
- **Show Scheduling**: Manage show timings, screen assignments, and date-specific scheduling.
- **Theater Management**: Organize theater details and screen dimensions.
- **Customer Oversight**: View and manage registered users.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Frontend** | EJS (Template Engine), Bootstrap 5, Vanilla JavaScript |
| **Database** | MySQL |
| **Security** | MD5 Hashing, LocalStorage Token Management |
| **Styling** | Custom CSS (Modern Aesthetics) |

---

## 📂 Project Structure

```text
Movie-Magic-master/
├── public/                 # Static assets (CSS, JS, Images)
│   ├── css/                # Stylesheets (Bootstrap & Custom)
│   ├── images/             # Movie posters, backgrounds, and icons
│   └── js/                 # Client-side logic for interactive components
├── views/                  # EJS template files for dynamic routing
│   ├── admin.ejs           # Admin login page
│   ├── admindash.ejs       # Admin control panel
│   ├── index.ejs           # Main landing page
│   ├── moviesdash.ejs      # Movie browsing dashboard
│   ├── seats.ejs           # Interactive seat booking
│   ├── success.ejs         # Booking confirmation
│   └── ...                 # Additional UI components
├── app.js                  # Main server entry point and API logic
├── package.json            # Project dependencies and metadata
└── PROJECT_OVERVIEW.md     # This documentation
```

---

## 📊 Database Schema (Inferred)

The application utilizes a relational MySQL database with the following core tables:

1.  **`customer`**: Stores user profiles (ID, Name, Email, Password, City, Contact).
2.  **`movie`**: Contains film metadata (ID, Name, Rating, Genre, Status, Description, Language).
3.  **`theater`**: Stores theater information.
4.  **`shows`**: Links movies to theaters, timings, and screen availability (includes JSON-stored `selected_seats`).
5.  **`bookings`**: Records all ticket purchases linked to users and shows.
6.  **`admin`**: Stores administrative credentials.

---

## ⚙️ Preparation & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL Server](https://www.mysql.com/)

### Setup Instructions

1.  **Database Configuration**:
    - Create a database named `lab`.
    - Import the SQL schema (if provided) or create the tables mentioned above.
    - Update the database credentials in `app.js` (lines 16-21):
      ```javascript
      var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "your_password",
        database: "lab"
      });
      ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Application**:
    ```bash
    node app.js
    ```
    The server will start on `http://localhost:3000`.

---

## ✨ Future Enhancements
- [ ] **Payment Integration**: Implement a real payment gateway (Stripe/Razorpay).
- [ ] **Email Notifications**: Send booking confirmations via SMTP.
- [ ] **Enhanced Encryption**: Transition from MD5 to Argon2 or BCrypt for better security.
- [ ] **Movie Trailers**: Integrate YouTube Iframes for direct trailer playback.
- [ ] **Admin Analytics**: Visual charts for revenue and booking trends.

---
*Created with ❤️ for Movie Magic.*
