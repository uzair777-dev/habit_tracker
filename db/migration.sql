-- Migration: Add habit_completions table for tracking daily habit completions
-- This optimizes storage by only recording when habits are completed (not non-completions)

USE habit_tracker_db;

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
