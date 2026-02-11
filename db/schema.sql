
-- 1. User Auth Database
CREATE DATABASE IF NOT EXISTS user_auth;
USE user_auth;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at BIGINT
);

-- 2. Habit Tracking Database
CREATE DATABASE IF NOT EXISTS habit_tracker_db;
USE habit_tracker_db;

CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    streak INT DEFAULT 0,
    schedule_type ENUM('daily', 'weekdays', 'weekends', 'custom') DEFAULT 'daily',
    schedule_days VARCHAR(50) DEFAULT NULL, -- Comma-separated day numbers (0=Sun, 1=Mon, etc.) for custom schedules
    description TEXT,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    completed_date DATE NOT NULL,
    UNIQUE KEY unique_log (habit_id, completed_date),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filehash VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_habit_date (habit_id, completion_date),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_auth.users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, completion_date),
    INDEX idx_habit_date (habit_id, completion_date)
);

-- 3. Forum Threads Database
-- Every message is stored in the forum_messages table
-- Thread ID is a hexadecimal representation of the creation timestamp in milliseconds
-- Root messages have is_root=1 and may have a root_title
-- All messages in the same thread share the same thread_id
CREATE DATABASE IF NOT EXISTS forum_db;
USE forum_db;

CREATE TABLE IF NOT EXISTS forum_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id VARCHAR(32) NOT NULL,             -- Hexadecimal timestamp (e.g., '18d4f2a1b3c')
    time BIGINT NOT NULL,                        -- Numerical timestamp in milliseconds
    user_id VARCHAR(255),                        -- User ID (nullable for anonymous posts)
    message TEXT NOT NULL,                       -- The actual message content
    is_root TINYINT(1) NOT NULL DEFAULT 0,      -- 1 if root message, 0 otherwise
    root_title VARCHAR(255) DEFAULT NULL,        -- Title for root messages (can be auto-generated)
    attachment VARCHAR(512) DEFAULT NULL,        -- Public shareable hyperlink to uploaded resource
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Virtual column to help enforce unique root constraint
    root_thread_id VARCHAR(32) GENERATED ALWAYS AS (IF(is_root = 1, thread_id, NULL)) STORED,
    INDEX idx_thread_id (thread_id),
    INDEX idx_time (time),
    INDEX idx_is_root (is_root),
    -- Ensure only one root per thread (NULL values are not considered duplicate)
    UNIQUE KEY unique_root_per_thread (root_thread_id)
);
