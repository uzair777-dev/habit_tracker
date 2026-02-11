
# Habit Tracker Updates - Habit Description & Scheduling

I have updated the Habit Tracker to support:
1.  **Habit Descriptions**: Added a description field to habits.
2.  **Habit End Dates**: Added an optional end date for habits. Habits with no end date are considered indefinite.
3.  **Calendar Visualization**: 
    - Habits are now visualized as text labels on the calendar for every scheduled day within their active date range (Start Date to End Date).
    - Optimized rendering by only calculating schedules for the currently viewed month.

## Changes Made

### Database
- Updated `habits` table schema:
  - Added `description` (TEXT)
  - Added `end_date` (DATE)
- Applied migration via `apply_migration.py`.

### Backend
- Updated `GET /api/habits`: Now returns `description`, `endDate`, and `startDate` (mapped from `created_at`).
- Updated `POST /api/habits`: Now accepts `description` and `endDate`.

### Frontend
- **Dashboard.jsx**:
  - Updated "Add Habit" modal to include Description (textarea) and End Date (date picker).
  - Pass these new fields to the backend.
- **HabitCalendar.jsx**:
  - Implemented logic to display habit names as labels on each day they are scheduled.
  - Checks: `StartDate <= Date <= EndDate` AND `isScheduledForDay`.
  - Displays green background for completed days, transparent for scheduled but not completed.

## How to Test
1.  Ensure backend is running (`cd backend && npm start`).
2.  Ensure frontend is running (`cd frontend && npm run dev`).
3.  Go to Dashboard.
4.  Click "New Habit".
5.  Enter a name, description, and optionally an end date.
6.  See the habit appear on the Calendar for relevant days.
