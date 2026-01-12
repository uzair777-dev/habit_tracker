# Nexus - Habit Tracker & Forum

Nexus is a state-of-the-art Habit Tracker and Community Forum built with a React (Vite) frontend and Node.js/Express backend, backed by a managed local MySQL/MariaDB instance.

------------------------

## Notice

This project is just our yearly project for college stuff, we might not update it further.
But, bare in mind that when I will leave this project be it will be in a great shape (<sup>Hopefully</sup>).
~~And probably will be documented properly.~~ (Foreshadowing)

------------------------

## Features

-   **Public Forum**: Anonymous posting with persistent identity via cookies.
-   **Habit Tracker**: Track your daily habits and streaks personalized to your user ID.
-   **User System**: Unique 64-bit Hex ID generation based on creation timestamp.
-   **File Storage**: Secure file upload with deduplication (hashing) and expiration logic.
-   **Rich UI**: Glassmorphism design with responsive dark mode.
-   **Local Database Management**: Automated local database instance setup script to avoid system-wide configuration conflicts.

## Architecture

-   **Frontend**: React + Vite + Tailwind CSS (located in `frontend/`)
-   **Backend**: Node.js + Express (located in `backend/`)
-   **Database**: MariaDB/MySQL running locally on port 3307 (managed by `setup_db.py`)
-   **Configuration**: `config/config.json`

## Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** (comes with Node.js)
-   **Python 3** (for the database setup script)
-   **MySQL/MariaDB Client** (installed via brew/apt, needed for the `mysql` command)

## Installation & Setup

> Something is better than nothing - Albert Einstein (probably)
Follow these steps to get the application running completely locally.

### 1. Install Dependencies

You need to install dependencies for both the backend and frontend.

```bash
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Initialize and Run Database

We use a custom Python script to spin up a local, isolated MariaDB instance on port `3307`. This prevents conflicts with any existing MySQL installations on your system.

**Open a new terminal** in the project root and run:

```bash
python3 setup_db.py
```

**IMPORTANT:**
-   This script initializes the database in the `data_p/` directory.
-   It starts the MariaDB server.
-   It imports the schema from `db/schema.sql`.
-   **You must keep this terminal window OPEN.** If you close it, the database server will stop.

### 3. Start the Backend Server

**Open a second terminal** in the project root and run:

```bash
cd backend
npm start
```

The server will start on **port 4000** (default) or the port specified in `config/config.json`.
You should see: `Backend server listening on port 4000`.

### 4. Start the Frontend Application

**Open a third terminal** in the project root and run:

```bash
cd frontend
npm run dev
```

The frontend development server will start (usually on **port 5173**).
Click the link shown in the terminal (e.g., `http://localhost:5173`) to open the application in your browser.

## Usage Guide

1.  **Access the App**: Navigate to the frontend URL (http://localhost:5173, or any url that will be given while starting the frontend server).
2.  **Identity**: Your User ID is automatically generated and stored in a cookie. You can see it in the Navbar.
3.  **Forum**: Post anonymous messages. Your User ID is attached to your posts(yet to implement, will probably implement).
4.  **Habits**: Add habits to track. These are saved to your ID(yet to implement \*again*).
5.  **Files**: Upload files. The system calculates a hash to prevent duplicates and stores metadata in the DB.

## Troubleshooting

-   **Database Connection Error**:
    -   Ensure `python3 setup_db.py` is running in a separate terminal.
    -   Verify it says "Server seems up".
    -   Check if port 3307 is available.

-   **Frontend issues**:
    -   If the frontend cannot connect to the backend, ensure the backend is running on port 4000.
    -   Check the browser console for CORS errors (the backend is configured to allow CORS).

-   **Port Conflicts**:
    -   If `setup_db.py` fails, ensure no other process is using port 3307. The script attempts to kill processes on this port, but might need manual intervention.

## Project Structure

```
├── backend/            # Express server source
├── frontend/           # React + Vite source
├── config/             # Configuration files
├── db/                 # Database schema scripts
├── data_p/             # Local database storage (auto-generated)
├── uploads/            # API File uploads storage
├── setup_db.py         # DB orchestration script
└── README.md           # This file
```
