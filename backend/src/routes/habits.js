// backend/src/routes/habits.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper function to calculate streak from completions
function calculateStreak(completions) {
    if (completions.length === 0) return 0;
    
    // Sort completions by date descending (most recent first)
    const sortedDates = completions
        .map(c => new Date(c.completion_date))
        .sort((a, b) => b - a);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if most recent completion is today or yesterday
    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);
    
    if (mostRecent < yesterday) {
        return 0; // Streak broken
    }
    
    // Count consecutive days
    let streak = 0;
    let expectedDate = new Date(mostRecent);
    
    for (const date of sortedDates) {
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === expectedDate.getTime()) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Get habits for a user with completion data
router.get('/habits', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json({ habits: [] });
    
    try {
        // Get all habits for user
        const [habits] = await pool.execute(
            'SELECT id, user_id, name FROM habits WHERE user_id = ?',
            [userId]
        );
        
        if (habits.length === 0) {
            return res.json({ habits: [] });
        }
        
        // Get completions for all habits (last 365 days for streak calculation)
        const habitIds = habits.map(h => h.id);
        const placeholders = habitIds.map(() => '?').join(',');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const [completions] = await pool.execute(
            `SELECT habit_id, completion_date 
             FROM habit_completions 
             WHERE habit_id IN (${placeholders}) 
             AND completion_date >= ?
             ORDER BY completion_date DESC`,
            [...habitIds, oneYearAgo.toISOString().split('T')[0]]
        );
        
        // Check today's completions
        const today = new Date().toISOString().split('T')[0];
        const todayCompletions = new Set(
            completions
                .filter(c => c.completion_date.toISOString().split('T')[0] === today)
                .map(c => c.habit_id)
        );
        
        // Build response with streak and completion status
        const habitsWithData = habits.map(habit => {
            const habitCompletions = completions.filter(c => c.habit_id === habit.id);
            const streak = calculateStreak(habitCompletions);
            const completedToday = todayCompletions.has(habit.id);
            
            return {
                id: habit.id,
                name: habit.name,
                streak,
                completedToday
            };
        });
        
        res.json({ habits: habitsWithData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Add a new habit
router.post('/habits', async (req, res) => {
    const { userId, name } = req.body;
    if (!userId || !name) return res.status(400).json({ error: 'Missing fields' });
    
    try {
        const [result] = await pool.execute(
            'INSERT INTO habits (user_id, name, streak) VALUES (?, ?, 0)',
            [userId, name]
        );
        res.json({ success: true, habitId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Mark habit as complete for a specific date (default: today)
router.post('/habits/:id/complete', async (req, res) => {
    const habitId = req.params.id;
    const { userId, date } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    const completionDate = date || new Date().toISOString().split('T')[0];
    
    try {
        // Insert completion (or ignore if already exists due to unique constraint)
        await pool.execute(
            'INSERT IGNORE INTO habit_completions (habit_id, user_id, completion_date) VALUES (?, ?, ?)',
            [habitId, userId, completionDate]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Remove habit completion for a specific date (default: today)
router.delete('/habits/:id/complete', async (req, res) => {
    const habitId = req.params.id;
    const { date } = req.query;
    
    const completionDate = date || new Date().toISOString().split('T')[0];
    
    try {
        await pool.execute(
            'DELETE FROM habit_completions WHERE habit_id = ? AND completion_date = ?',
            [habitId, completionDate]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Get habit completions for a date range (for calendar view)
router.get('/habits/completions', async (req, res) => {
    const { userId, startDate, endDate } = req.query;
    
    if (!userId) return res.json({ completions: [] });
    
    try {
        const query = startDate && endDate
            ? `SELECT hc.habit_id, h.name as habit_name, hc.completion_date 
               FROM habit_completions hc
               JOIN habits h ON hc.habit_id = h.id
               WHERE hc.user_id = ? AND hc.completion_date BETWEEN ? AND ?
               ORDER BY hc.completion_date DESC`
            : `SELECT hc.habit_id, h.name as habit_name, hc.completion_date 
               FROM habit_completions hc
               JOIN habits h ON hc.habit_id = h.id
               WHERE hc.user_id = ?
               ORDER BY hc.completion_date DESC`;
        
        const params = startDate && endDate 
            ? [userId, startDate, endDate]
            : [userId];
        
        const [completions] = await pool.execute(query, params);
        
        res.json({ completions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Delete a habit (cascades to completions via foreign key)
router.delete('/habits/:id', async (req, res) => {
    const habitId = req.params.id;
    const { userId } = req.query;
    
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    try {
        await pool.execute(
            'DELETE FROM habits WHERE id = ? AND user_id = ?',
            [habitId, userId]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
