
ALTER TABLE habit_tracker_db.habits 
ADD COLUMN description TEXT,
ADD COLUMN end_date DATE DEFAULT NULL;
